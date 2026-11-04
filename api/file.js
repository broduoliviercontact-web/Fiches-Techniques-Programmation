import { Readable } from "node:stream";
import { get } from "@vercel/blob";
import { isAuthed } from "./_lib.js";

// Streams a private attachment to a logged-in user.
export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).send("Connecte-toi d'abord sur le site.");
  const p = String(req.query.p || "");
  if (!p.startsWith("fiches/") || p.includes("..")) return res.status(400).send("Fichier invalide");
  try {
    const r = await get(p, { access: "private" });
    if (!r) return res.status(404).send("Fichier introuvable");
    res.setHeader("Content-Type", r.blob.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${p.split("/").pop().replace(/"/g, "")}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    Readable.fromWeb(r.stream).pipe(res);
  } catch (e) {
    res.status(500).send("Lecture du fichier impossible");
  }
}
