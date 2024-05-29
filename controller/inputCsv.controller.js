const csv = require('csv-parser');
const fs = require("fs");
const nodemailer = require("nodemailer")
const { user } = require("../models/User.model");
const dotenv = require('dotenv').config();

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL",
        pass: process.env.GMAILPASS"
    }
});

// Processes Singluar Data after Failure of Bulk Insert.
const processRowSingle = async (toInsertInBulk) => {
    let failedCnt = 0;
    for (let i = 0; i < toInsertInBulk.length; i++) {
        try {
            const row = toInsertInBulk[i];
            const userToSave = new user(row);
            await userToSave.save();
        } catch (error) {
            if (error.code === 11000) {
                console.log(`Duplicate key error for email: ${toInsertInBulk[i].email}`);
            } else {
                console.log("There has been an Error", error);
            }
            failedCnt++;
        } finally {
            console.log("Finished processing single row");
        }
    }
    return failedCnt;
};
// Processes CSV file via streaming it and then inserts all the data from a batch into mongo db server.
const readCsv = async (res, pathForCsv, fallbackValues) => {
    let toInsertInBulk = [];
    const batchSize = 100;
    const uniqueEmails = new Set();
    let currentSizeOfBatch = 0;
    let successCnt = 0;
    let failureCnt = 0;
    try {

        const readStream = fs.createReadStream(pathForCsv)
            .pipe(csv())
            .on('data', async function (row) {
                if (!row.email) row.email = fallbackValues["email"];
                if (row.email && !uniqueEmails.has(row.email.trim())) {
                    uniqueEmails.add(row.email.trim());
                    const dataToPush = {};
                    const entities = {}
                    const rowKeys = Object.keys(row);
                    for (let i = 0; i < rowKeys.length; i++) {
                        if (row[rowKeys[i]].trim() === "") {
                            if (rowKeys[i] === "name" || rowKeys[i] === "email") {
                                dataToPush[rowKeys[i]] = fallbackValues[rowKeys[i]] || null;
                            }
                            else {
                                entities[rowKeys[i]] = fallbackValues[rowKeys[i]] || null;
                            }
                            continue;
                        }
                        if (rowKeys[i] === "name" || rowKeys[i] === "email") {
                            dataToPush[rowKeys[i]] = row[rowKeys[i]].trim();
                        }
                        else entities[rowKeys[i]] = row[rowKeys[i]].trim();
                    }
                    dataToPush["entities"] = entities;
                    toInsertInBulk.push(dataToPush);
                    currentSizeOfBatch++;
                    if (currentSizeOfBatch >= batchSize) {
                        readStream.pause();
                        try {
                            await user.insertMany(toInsertInBulk, { ordered: false });
                            successCnt += toInsertInBulk.length;
                        } catch (error) {
                            console.log("Bulk insert error, Trying for Single Files.");
                            const tempLen = toInsertInBulk.length;
                            const tempFailedCnt = await processRowSingle(toInsertInBulk);
                            failureCnt += tempFailedCnt;
                            successCnt += tempLen - tempFailedCnt;
                        } finally {
                            toInsertInBulk = [];
                            currentSizeOfBatch = 0;
                            readStream.resume();
                        }
                    }
                } else {
                    console.log("Duplicate Email Found!! for", row.email);
                    failureCnt++;
                }
            })
            .on('end', async function () {
                if (toInsertInBulk.length > 0) {
                    try {
                        await user.insertMany(toInsertInBulk, { ordered: false });
                        successCnt += toInsertInBulk.length;
                    } catch (error) {
                        console.log("Bulk insert error, Trying for single files");
                        const tempFailedCnt = await processRowSingle(toInsertInBulk);
                        failureCnt += tempFailedCnt;
                    } finally {
                        console.log("Batch Processing Finished!!");
                    }
                }
                console.log("Number of files Successfully processed:", successCnt);
                console.log("Number of files Unsuccessfully processed:", failureCnt);
                res.status(200).json({ msg: `Number of files Successfully processed: ${successCnt} and Number of files Unsuccessfully processed: ${failureCnt}` })
            })
            .on("error", function (e) {
                console.log("There has been an error", e);
            });
    }
    catch (error) {
        console.log("Error in processing file:", error);
    }
};

// Main Task Program
const performTask = async (req, res) => {
    try {
        input = req.body;
        fallbackKeys = Object.keys(input);
        fallbackValues = {}
        for (let i = 0; i < fallbackKeys.length; i++) {
            const title = fallbackKeys[i];
            if (title.split("_")[0] === "fallback") fallbackValues[title.split("_")[1]] = input[title];
        }
        if (fs.existsSync(req.body.pathForCsv)) {
            console.log('File exists. Proceeding with operations.');
            await readCsv(res, req.body.pathForCsv, fallbackValues);
        }
        else {
            console.log('File does not exist. Please check the path.');
            res.status(400).json({ "msg": "File does not exist. Please check the path." })
        }
    }
    catch (error) {
        res.status(400).json({ "msg": "There has been an error", error: error })
    }
};

// Used for sending the mail via nodemailer.
const sendMail = (mailOptions) => {
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log("There has been an error", error);
        } else {
            console.log(`Email sent to ${mailOptions.to} : ` + info.response);
        }
    });
}
// Used for sending email to all listed users in mongodb.
const sendMailToList = async (req, res) => {
    try {

        const User = user.find({});
        for await (const currentUser of User) {
            if (currentUser.emailSub) {
                const clientEmail = currentUser.email;
                const clientName = currentUser.name;
                const clientCity = currentUser.city
                const unSubLink = `http://localhost:5124/api/unsubscribeMail/${clientEmail}`;
                const message = `
                        Hey ${clientName}!
                
                        Thank you for signing up with your email ${clientEmail}. We have received your city as ${clientCity}.
                        
                        Team MathonGo.



                        <center>To unsubscribe, please click <a style="color:blue" href="${unSubLink}">here.</a><center>
                    `
                var mailOptions = {
                    from: process.env.GMAIL || "priyanshu24052@gmail.com",
                    to: clientEmail,
                    subject: 'Hello There',
                    html: message
                };
                try {
                    await sendMail(mailOptions)
                }
                catch (error) {
                    console.log("There has been an Error..", error);
                }
            }
            else {
                console.log("User has not subscribed to email list " + currentUser.email);
            }
        }
        res.status(200).json({ msg: `Email Sent Successfully!!` });
    }
    catch (error) {
        res.status(400).json({ msg: `There has been an error`, error });
    }
}
// Used by the client to unsubscribe mailing services.
const unsubscribeMail = async (req, res) => {
    console.log("Please Unsub " + req.params.token);
    try {
        await user.updateOne({ email: req.params.token }, { emailSub: false })
        res.status(200).json({ msg: "Done" });
    }
    catch (error) {
        res.status(400).json({ msg: `There has been an error`, error });
    }
}

module.exports = { performTask, sendMailToList, unsubscribeMail };
