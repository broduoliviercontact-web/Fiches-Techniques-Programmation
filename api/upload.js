import { handleUpload } from "@vercel/blob/client";
import { isAuthed } from "./_lib.js";

// Issues short-lived tokens so the browser can send PDFs/images straight to Vercel Blob
// (no 4.5 MB function limit). Only logged-in users get a token.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!isAuthed(req)) throw new Error("Non connecté");
        return {
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
