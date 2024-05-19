const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const performTask = require("./routes/inputCsv.routes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5124;
const mongooseUrl = process.env.MONGOOSEURL || "mongodb+srv://priyanshu24052:iow674EVejmhJIAZ@cluster0.dxcpiaw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/Mathongo";

mongoose.pluralize(null);
mongoose.connect(mongooseUrl).then(() => console.log("Connected to Database Successfully!!")).catch((err) => console.log(err));

app.use(bodyParser.json());
app.get("/",(req,res)=>{
  res.send("Backend is working")
})
app.use('/api', performTask);

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
