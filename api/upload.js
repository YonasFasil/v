const express = require("express");
const multer = require("multer");
const { put } = require("@vercel/blob");
const { nanoid } = require("nanoid");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  console.log("=== Upload API Debug ===");
  console.log("BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN);
  console.log("BLOB_READ_WRITE_TOKEN length:", process.env.BLOB_READ_WRITE_TOKEN?.length || 0);
  console.log("File received:", !!req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  console.log("File details:", {
    name: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN not found in environment");
    return res.status(500).json({ error: "Blob storage not configured" });
  }

  try {
    const filename = `venues/${nanoid()}-${req.file.originalname}`;
    console.log("Attempting to upload:", filename);

    const blob = await put(filename, req.file.buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log("Upload successful:", blob.url);
    res.status(200).json(blob);
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      error: "Failed to upload file.",
      details: error.message
    });
  }
});

module.exports = router;
