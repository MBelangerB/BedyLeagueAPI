const nodemailer = require('nodemailer');

var transporter;

function initTransporter() {
    if (process.env.NODE_ENV == "development") {
        console.log('Use development transporter');
        transporter = nodemailer.createTransport({
            host: process.env.email_host,
            port: parseInt(process.env.email_port)
        });
    } else {
        console.log('Use another transporter :', process.env.NODE_ENV);
        transporter = nodemailer.createTransport({
            host: process.env.email_host,
            port: parseInt(process.env.email_port),
            secure: process.env.email_secure, // true for 465, false for other ports
            auth: {
                user: process.env.email_username,
                pass: process.env.email_passwd,
            },
            tls: {
                ciphers:'SSLv3'
            }
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
                console.error(error);
                return res.status(503).json({ OK: false, msg: 'Cannot Send Mail. An Error Occurred while delivering this message.' });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({ OK: true, msg: 'Email will be sent with success.' });
            }
        });

    } catch (ex) {
        console.error('An error occured in exports.sendMail')
        console.error(ex);
        return res.status(500).json({
            msg: 'Cannot Send Mail. An Error Occurred while delivering this message.',
            OK: false,
            err: ex
        });
    }
}
// https://umbraco.com/knowledge-base/http-status-codes/