const nodemailer = require('nodemailer');
const BedyBot = require('../../util/GlobalEnum');

let transporter;

function initTransporter() {
    if (process.env.NODE_ENV == 'development') {
        console.log('Use development transporter');
        transporter = nodemailer.createTransport({
            host: process.env.email_host,
            port: parseInt(process.env.email_port),
        });
    } else {
        // secure: process.env.email_secure, // true for 465, false for other ports
        console.log('Use another transporter :', process.env.NODE_ENV);
        transporter = nodemailer.createTransport({
            host: process.env.email_host,
            port: parseInt(process.env.email_port),
            secure: false,
            auth: {
                user: process.env.email_username,
                pass: process.env.email_passwd,
            },
            // TODO: C'est pas jolie ça
			tls: {
				rejectUnauthorized: false,
			},
        });
    }
}

/**
 * SendMail routing function
 * Used by contact us front end
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.sendMail = async function (req, res) {
    try {
        console.log('Enter in SendMail');
        initTransporter();
        const { subject, content, email, name, messageType } = req.body;

        let message = '<b>From </b> :' + name + ' <br/>';
        message += '<b>Email </b> : ' + email + ' <br/>';
        message += content;

        const mailOptions = {
            // Email who sent the mail. It's postfix email
            from: process.env.email_emailFrom,
             // Email who receive the mail. Target
            to: process.env.email_emailTo,
            // Person who send the mail
            replyTo: email,
            subject: subject,
            text: message,
            html: message,
        };

        if (messageType == BedyBot.FrontEnd.CONTACTUS_TYPE.SUGGESTION) {
            const emailTo = process.env.email_emailTo.split('@');
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
        console.error('An error occured in exports.sendMail');
        console.error(ex);
        return res.status(500).json({
            msg: 'Cannot Send Mail. An Error Occurred while delivering this message.',
            OK: false,
            err: ex,
        });
    }
};
// https://umbraco.com/knowledge-base/http-status-codes/