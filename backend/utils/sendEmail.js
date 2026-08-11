const { Resend } = require("resend");

const sendEmail = async ({
  email,
  subject,
  message,
}) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error("EMAIL_FROM is missing in environment variables");
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: message,
    });

    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }

    return {
      success: true,
      message: "Email sent successfully",
      messageId: data ? data.id : null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = sendEmail;