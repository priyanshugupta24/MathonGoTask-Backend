const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const performTask = require("./routes/inputCsv.routes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const mongooseUrl = process.env.MONGOOSEURL || "mongodb://127.0.0.1:27017/Mathongo";

mongoose.pluralize(null);
mongoose.connect(mongooseUrl).then(() => console.log("Connected to Database Successfully!!")).catch((err) => console.log(err));

app.use(bodyParser.json());
app.get("/",(req,res)=>{
  res.send("It is working!!")
})
app.use('/api', performTask);

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
