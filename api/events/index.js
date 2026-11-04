import { redis, KEY, requireAuth, parse, ID_RE } from "../_lib.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const all = (await redis.hgetall(KEY)) || {};
    const events = Object.entries(all).map(([id, v]) => ({ id, ...parse(v) }));
    return res.status(200).json({ events });
  }
  if (req.method === "POST") {
    const { id, data } = req.body || {};
    if (!ID_RE.test(id || "") || !data || typeof data !== "object") return res.status(400).json({ error: "bad_request" });
    const created = await redis.hsetnx(KEY, id, JSON.stringify({ ...data, updatedAt: Date.now() }));
    if (!created) return res.status(409).json({ error: "exists" });
    return res.status(201).json({ id });
  }
  res.status(405).end();
}
