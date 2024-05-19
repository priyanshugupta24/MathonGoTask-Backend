const express = require('express');
const router = express.Router();

let { performTask,sendMailToList,unsubscribeMail } = require("../controller/inputCsv.controller");

router.route("/performTask").post(performTask);
router.route("/sendMailToList").post(sendMailToList);
router.route("/unsubscribeMail/:token").get(unsubscribeMail);

module.exports = router;