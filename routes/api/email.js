const nodemailer = require('nodemailer');

var transporter;

function initTransporter() {
    if (process.env.NODE_ENV == "development") {
        transporter = nodemailer.createTransport({
            host: process.env.email_host,
            port: parseInt(process.env.email_port)
        });
    } else {
        transporter = nodemailer.createTransport({
            host: process.env.email_host,
            port: parseInt(process.env.email_port),
            secure: process.env.email_secure, // true for 465, false for other ports
            auth: {
                user: process.env.email_username,
                pass: process.env.email_passwd,
            },
        });
    }
}

exports.sendMail = async function (req, res, next) {
    try {
        console.log('Enter in SendMail');
        initTransporter();
        let { subject, content, emailFrom, name } = req.body;

        let message = '<b>From </b> :' + name + ' <br/>' + content;

        var mailOptions = {
            from: emailFrom,
            to: process.env.email_emailTo,
            subject: subject,
            text: message,
            html: message
        };

        await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.status(503).json({ msg: 'Cannot Send Mail. An Error Occurred while delivering this message.' });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({ msg: 'Email will be sent with success.' });
            }
        });

    } catch (ex) {
        console.error(ex);
        return res.status(500).json({
            msg: 'Cannot Send Mail. An Error Occurred while delivering this message.',
            err: ex
        });
    }
}
// https://umbraco.com/knowledge-base/http-status-codes/