const nodemailer = require('nodemailer');
const BedyBot = require('../../util/GlobalEnum')

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
            secure: false, // process.env.email_secure, // true for 465, false for other ports
            auth: {
                user: process.env.email_username,
                pass: process.env.email_passwd,
            },
            // TODO: C'est pas jolie ça
			tls: {
				rejectUnauthorized: false
			}
        });
    }
}

exports.sendMail = async function (req, res, next) {
    try {
        console.log('Enter in SendMail');
        initTransporter();
        let { subject, content, email, name, messageType } = req.body;

        let message = '<b>From </b> :' + name + ' <br/>';
        message += '<b>Email </b> : '  + email + ' <br/>';
        message += content;

        var mailOptions = {
            from: process.env.email_emailFrom,  // Email who sent the mail. It's postfix email
            to: process.env.email_emailTo,      // Email who receive the mail. Target
            replyTo: email,                     // Person who send the mail
            subject: subject,
            text: message,
            html: message
        };

        if (messageType == BedyBot.FrontEnd.CONTACTUS_TYPE.SUGGESTION) {
            let emailTo = process.env.email_emailTo.split('@');
            mailOptions.to = emailTo[0] + '+suggest@' + emailTo[1];
        }

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