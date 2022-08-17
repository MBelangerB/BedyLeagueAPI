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
        console.log('Coucou l\'email.');
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
                return res.json({ msg: 'Cannot Send Mail. An Error Occurred while delivering this message.' });
            } else {
                console.log('Email sent: ' + info.response);
                return res.json({ msg: 'Email will be sent with success.' });
            }
        });

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
}