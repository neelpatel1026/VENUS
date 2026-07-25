const nodemailer = require("nodemailer");
const dns = require("dns");

// Force Node to prioritize IPv4 DNS resolution to prevent ENETUNREACH errors on IPv6-unfriendly environments (like Render)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
  console.log("[SMTP DNS] Prioritizing IPv4 resolution for outbound connections.");
}

// Helper to resolve hostname to IPv4 address dynamically to prevent network errors in IPv6-constrained container systems
async function resolveHostToIPv4(hostname) {
  try {
    const dnsPromises = dns.promises;
    const addresses = await dnsPromises.resolve4(hostname);
    if (addresses && addresses.length > 0) {
      console.log(`[DNS RESOLVE] Dynamic DNS resolved ${hostname} to IPv4: ${addresses[0]}`);
      return addresses[0];
    }
  } catch (err) {
    console.warn(`[DNS RESOLVE] dns.resolve4 failed for ${hostname}: ${err.message}. Trying dns.lookup.`);
    try {
      const result = await dns.promises.lookup(hostname, { family: 4 });
      console.log(`[DNS RESOLVE] dns.lookup resolved ${hostname} to IPv4: ${result.address}`);
      return result.address;
    } catch (lookupErr) {
      console.error(`[DNS RESOLVE] dns.lookup failed for ${hostname}: ${lookupErr.message}`);
    }
  }
  return hostname; // fallback to original hostname on resolve failures
}

const sendEmail = async ({
  email,
  subject,
  message,
}) => {
  try {
    const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.GMAIL_PASS;
    const originalHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
    const secure = process.env.EMAIL_SECURE === "true" || process.env.SMTP_SECURE === "true" || port === 465;

    // Dynamically resolve target host to IPv4 to prevent ENETUNREACH exceptions
    const ipv4Host = await resolveHostToIPv4(originalHost);

    const transporterOptions = {
      host: ipv4Host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      // Pass the original hostname as servername for TLS validation (SNI verification)
      tls: {
        servername: originalHost,
        rejectUnauthorized: true,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      family: 4, // Force IPv4 socket connection
    };

    console.log(`[SMTP TRANS] Building transporter targeting: ${originalHost} (via IP: ${ipv4Host}) on port ${port}`);

    const transporter = nodemailer.createTransport(transporterOptions);

    const mailOptions = {
      from: `"VENUS CARE Support" <${user}>`,
      to: email,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to ${email}`);

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error(`❌ Email sending failed to ${email}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;