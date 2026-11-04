import { checkPassword, sessionCookie, isAuthed } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ ok: isAuthed(req), configured: !!process.env.SITE_PASSWORD });
  if (req.method === "DELETE") { res.setHeader("Set-Cookie", sessionCookie(true)); return res.status(204).end(); }
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.SITE_PASSWORD) return res.status(500).json({ error: "SITE_PASSWORD manquant dans Vercel" });
  const pw = (req.body && req.body.password) || "";
  if (!checkPassword(pw)) { await new Promise(r => setTimeout(r, 600)); return res.status(401).json({ error: "bad_password" }); }
  res.setHeader("Set-Cookie", sessionCookie(false));
  res.status(200).json({ ok: true });
}
