import { redis, KEY, requireAuth, merge, parse, ID_RE } from "../_lib.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  const id = req.query.id;
  if (!ID_RE.test(id || "")) return res.status(400).json({ error: "bad_id" });

  if (req.method === "GET") {
    const v = parse(await redis.hget(KEY, id));
    return v ? res.status(200).json({ id, ...v }) : res.status(404).json({ error: "not_found" });
  }
  if (req.method === "PATCH") {
    const patch = req.body;
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return res.status(400).json({ error: "bad_request" });
    const cur = parse(await redis.hget(KEY, id));
    if (!cur) return res.status(404).json({ error: "not_found" });
    const next = merge(cur, patch);
    next.updatedAt = Date.now();
    await redis.hset(KEY, { [id]: JSON.stringify(next) });
    return res.status(200).json({ id, ...next });
  }
  if (req.method === "DELETE") {
    await redis.hdel(KEY, id);
    return res.status(204).end();
  }
  res.status(405).end();
}
