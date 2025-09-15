const { put } = require("@vercel/blob");
const { nanoid } = require("nanoid");

// Configure for Pages API Routes (not App Router)
const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log("=== Upload API Debug ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN not found in environment");
      return res.status(500).json({ error: "Blob storage not configured" });
    }

    // Get filename from query params or generate one
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const filename = searchParams.get('filename') || `upload-${nanoid()}.bin`;

    console.log("Filename:", filename);

    // Use Vercel's recommended approach for Pages API Routes
    // Pass the request directly to put() function
    const blobFilename = `venues/${nanoid()}-${filename}`;
    console.log("Uploading to blob:", blobFilename);

    const blob = await put(blobFilename, req, {
      access: 'public',
    });

    console.log("Upload successful:", blob.url);
    return res.status(200).json(blob);

  } catch (error) {
    console.error("Upload API error:", error);
    return res.status(500).json({
      error: "Upload failed",
      details: error.message,
      stack: error.stack
    });
  }
};

module.exports.config = config;
