const { gmailService } = require('../../../server/services/gmail');
const { storage } = require('../../../server/storage');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { testEmail } = req.body;
    if (!testEmail) {
      return res.status(400).json({ message: 'Test email address is required' });
    }

    // Temporarily hardcode credentials for testing
    const emailConfig = {
      value: {
        email: "noreplyvenuine@gmail.com",
        password: "tque mazq ibfk kadq",
        enabled: true,
      }
    };

    await gmailService.sendMail({
      from: emailConfig.value.email,
      to: testEmail,
      subject: "Venuine Email Configuration Test",
      text: "This is a test email to confirm your Venuine email configuration is working correctly.",
    });

    res.status(200).json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ message: "Failed to send test email", error: error.message });
  }
};
