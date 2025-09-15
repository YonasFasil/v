import express from "express";
import multer from "multer";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const filename = `${nanoid()}-${req.file.originalname}`;
    const blob = await put(filename, req.file.buffer, {
      access: "public",
    });

    res.status(200).json(blob);
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    res.status(500).json({ error: "Failed to upload file." });
  }
});

export default router;
