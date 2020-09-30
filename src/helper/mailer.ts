import nodemailer from "nodemailer";

// const options = {
//   auth: {
//     api_key: process.env.SENDGRID_API_KEY,
//   },
// };

// const mailer = nodemailer.createTransport(sgTransport(options));

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "darryl.carter@ethereal.email",
    pass: "MDf1NdsXM1DkuuFaTj",
  },
});

export const sendEmail = async (email: string, token: string) => {
  let mail = {
    from: "test@example.com",
    to: email,
    subject: "Verify your email",
    text: `Hello, \n\nPlease verify your account by clicking the link: \nhttp://localhost:5000/auth/confirmation/${token} .\n`,
  };

  await transporter.sendMail(mail, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Message sent: " + nodemailer.getTestMessageUrl(info));
    }
  });

  return;
};
