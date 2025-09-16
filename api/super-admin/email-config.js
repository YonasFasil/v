const { storage } = require('../../../server/storage');
const { gmailService } = require('../../../server/services/gmail');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { email, pass } = req.body;
      await storage.updateSetting("global_email", { email, pass });
      return res.status(200).json({ message: "Configuration saved." });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save configuration." });
    }
  }

  if (req.method === 'GET') {
    try {
      const config = await storage.getSetting("global_email");
      return res.status(200).json(config?.value || {});
    } catch (error) {
      return res.status(500).json({ error: "Failed to retrieve configuration." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
};
