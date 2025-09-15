const { put } = require("@vercel/blob");
const { nanoid } = require("nanoid");

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log("=== Upload API Debug ===");
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN);
    console.log("BLOB_READ_WRITE_TOKEN length:", process.env.BLOB_READ_WRITE_TOKEN?.length || 0);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN not found in environment");
      return res.status(500).json({ error: "Blob storage not configured" });
    }

    // Parse multipart form data manually
    const contentType = req.headers['content-type'];
    console.log("Content-Type:", contentType);

    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
    }

    // Get the raw body
    let body = '';
    req.setEncoding('binary');

    return new Promise((resolve) => {
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        try {
          console.log("Body length:", body.length);

          // Extract boundary from content-type
          const boundary = contentType.split('boundary=')[1];
          if (!boundary) {
            return res.status(400).json({ error: "No boundary found in multipart data" });
          }

          console.log("Boundary:", boundary);

          // Split by boundary and find the file part
          const parts = body.split('--' + boundary);
          let fileBuffer = null;
          let filename = '';

          for (const part of parts) {
            if (part.includes('Content-Disposition: form-data') && part.includes('filename=')) {
              // Extract filename
              const filenameMatch = part.match(/filename="([^"]+)"/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }

              // Extract file content (after double newline)
              const contentStart = part.indexOf('\r\n\r\n');
              if (contentStart !== -1) {
                const fileContent = part.substring(contentStart + 4);
                fileBuffer = Buffer.from(fileContent, 'binary');
                console.log("File extracted:", filename, "Size:", fileBuffer.length);
                break;
              }
            }
          }

          if (!fileBuffer || !filename) {
            return res.status(400).json({ error: "No file found in upload" });
          }

          // Upload to Vercel Blob
          const blobFilename = `venues/${nanoid()}-${filename}`;
          console.log("Attempting to upload:", blobFilename);

          const blob = await put(blobFilename, fileBuffer, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN
          });

          console.log("Upload successful:", blob.url);
          res.status(200).json(blob);
          resolve();

        } catch (error) {
          console.error("Error processing upload:", error);
          res.status(500).json({
            error: "Failed to process upload.",
            details: error.message
          });
          resolve();
        }
      });
    });

  } catch (error) {
    console.error("Upload API error:", error);
    return res.status(500).json({
      error: "Upload failed",
      details: error.message
    });
  }
};
