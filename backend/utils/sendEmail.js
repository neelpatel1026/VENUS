const nodemailer = require("nodemailer");

// Create transporter once with strict timeouts to prevent process hangs in production
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  connectionTimeout: 8000, // 8 seconds connection timeout
  greetingTimeout: 8000,   // 8 seconds greeting timeout
  socketTimeout: 10000,    // 10 seconds inactivity timeout
});

const sendEmail = async ({
  email,
  subject,
  message,
}) => {
  try {
    const mailOptions = {
      from: `"Venus Support" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent to ${email}`);

    return {
      success: true,
      message: "Email sent successfully",
    };

  } catch (error) {

    console.error(
      `❌ Email sending failed: ${error.message}`
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = sendEmail;