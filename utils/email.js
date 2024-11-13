const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");
// const aws = require("@aws-sdk/client-ses");

// const ses = new aws.SES({
//   apiVersion: "2010-12-01",
//   region: process.env.AWS_SES_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
//   },
// });

//const htmlToText = require("html-to-text");
// 1) Create a transporter
module.exports = class Email {
  constructor(req, email, password) {
    // const { body } = req;
    // console.log(body);
    this.firstname = req.body?.name?.split(" ")[0];
    this.to = req.body.email;
    // this.from = process.env.AWS_SES_EMAIL;
    this.from = email;
    this.password = password;
    this.otp = req.body.otp;
  }
  newTransport() {
    // return nodemailer.createTransport({
    //   SES: { ses, aws },
    // });
    return nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      auth: {
        user: this.from,
        pass: this.password,
      },
    });
  }

  async send(subject, template) {
    //console.log(html);
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      // html: template,
      // text: htmlToText.fromString(html),
      text: template,
    };

    try {
      const info = await this.newTransport().sendMail(mailOptions);
      // console.log({ info });
      return { info };
    } catch (err) {
      console.log({ err, from: this.from });
      return { err };
    }
  }
  async sendOTP() {
    const mail = await this.send(
      `BITOTSAV verification OTP`,
      `Hello ${
        this.firstname || "User"
      },\nThe OTP to verify you BITOTSAV account is: ${this.otp}
      This otp is valid only for 10 minutes.\n\nThanks\nTeam BITOTSAV`
    );
    return mail;
  }

  async sendPasswordReset() {
    const mail = await this.send(
      "BITOTSAV Account password reset OTP",
      `The password reset OTP is: ${this.otp} (valid only for 10 minutes)\n\nThanks\nTeam BITOTSAV`
    );
    return mail;
  }
};
