var mongoose = require('mongoose');

const fallback_name = "Jane_Doe";
const fallback_email = "janedoe@gmail.com";

let userSchema = new mongoose.Schema({
    name : {
        type : String,
        default : fallback_name,
    },
    email : {
        type : String,
        unique : true,
        default : fallback_email
    },
    emailSub : {
        type : Boolean,
        default : true
    },
    entities : {
        type : mongoose.Schema.Types.Mixed,
    },
});

const user = mongoose.model("User",userSchema);

module.exports = { user };