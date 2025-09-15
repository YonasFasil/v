const { put } = require("@vercel/blob");
const { nanoid } = require("nanoid");

// Configure Vercel's body parser to handle raw requests
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log("=== Upload API Debug ===");
  console.log("Method:", req.method);
  console.log("Content-Type:", req.headers['content-type']);

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

    // Collect the request body
    const chunks = [];

    return new Promise((resolve) => {
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const body = buffer.toString('binary');

          console.log("Body length:", body.length);

          // Extract boundary from content-type
          const contentType = req.headers['content-type'];
          const boundary = contentType?.split('boundary=')[1];

          if (!boundary) {
            return res.status(400).json({ error: "No boundary found in multipart data" });
          }

          // Parse multipart data
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

              // Find the start of file content (after headers)
              const headerEnd = part.indexOf('\r\n\r\n');
              if (headerEnd !== -1) {
                const fileContent = part.substring(headerEnd + 4, part.length - 2); // Remove trailing \r\n
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
          console.log("Uploading to blob:", blobFilename);

          const blob = await put(blobFilename, fileBuffer, {
            access: "public",
          });

          console.log("Upload successful:", blob.url);
          res.status(200).json(blob);
          resolve();

        } catch (error) {
          console.error("Error processing upload:", error);
          res.status(500).json({
            error: "Failed to process upload.",
            details: error.message,
            stack: error.stack
          });
          resolve();
        }
      });

      req.on('error', (error) => {
        console.error("Request error:", error);
        res.status(500).json({
          error: "Request error",
          details: error.message
        });
        resolve();
      });
    });

  } catch (error) {
    console.error("Upload API error:", error);
    return res.status(500).json({
      error: "Upload failed",
      details: error.message,
      stack: error.stack
    });
  }
}
