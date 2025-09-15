const { put } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("=== Blob Test API ===");
    console.log("BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN);
    console.log("BLOB_READ_WRITE_TOKEN value:", process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + "...");

    const testContent = `Test upload at ${new Date().toISOString()}`;
    const filename = `test/test-${Date.now()}.txt`;

    console.log("Attempting to upload test file:", filename);

    const blob = await put(filename, testContent, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log("Test upload successful:", blob.url);

    return res.json({
      success: true,
      message: "Blob storage is working!",
      blob: blob,
      environment: {
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0
      }
    });

  } catch (error) {
    console.error("Blob test error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: {
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
        errorCode: error.code,
        errorStack: error.stack
      }
    });
  }
};