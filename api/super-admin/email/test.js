const { storage } = require('../../../server/storage');
const { gmailService } = require('../../../server/services/gmail');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ message: '"to" address is required' });
    }

    const emailConfig = await storage.getSetting("global_email");
    if (!emailConfig || !emailConfig.value.email || !emailConfig.value.pass) {
      return res.status(400).json({ message: "Email service is not configured." });
    }

    await gmailService.sendMail({
      from: emailConfig.value.email,
      to: to,
      subject: "Venuine Email Configuration Test",
      text: "This is a test email to confirm your Venuine email configuration is working correctly.",
    });

    res.status(200).json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ message: "Failed to send test email", error: error.message });
  }
};
