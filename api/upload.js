import { put } from "@vercel/blob";
import { isAuthed } from "./_lib.js";

// Receives one file (raw body) and stores it in the private Blob store.
// Vercel limits function request bodies to about 4.5 MB.

const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX = 4.4 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!isAuthed(req)) return res.status(401).json({ error: "auth" });
  const type = String(req.headers["content-type"] || "").split(";")[0].trim();
  if (!TYPES.includes(type)) return res.status(415).json({ error: "type" });
  const fiche = String(req.headers["x-fiche"] || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "divers";
  const name = decodeURIComponent(String(req.headers["x-filename"] || "fichier"))
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-120) || "fichier";

  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > MAX) return res.status(413).json({ error: "too_large" }); chunks.push(c); }
  if (!size) return res.status(400).json({ error: "empty" });

  try {
    const blob = await put(`fiches/${fiche}/${name}`, Buffer.concat(chunks), { access: "private", contentType: type, addRandomSuffix: true });
    res.status(200).json({ path: blob.pathname });
  } catch (e) {
    res.status(500).json({ error: "blob", message: e.message });
  }
}
