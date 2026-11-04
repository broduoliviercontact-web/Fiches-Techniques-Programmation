import { createHmac, timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();
export const KEY = "fiches:events"; // Redis hash: id -> fiche JSON

const COOKIE = "ftp_session";

function token() {
  const pw = process.env.SITE_PASSWORD || "";
  return createHmac("sha256", "fiches-techniques:" + pw).update("session-v1").digest("hex");
}

export function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function isAuthed(req) {
  if (!process.env.SITE_PASSWORD) return false;
  const got = readCookie(req, COOKIE) || "";
  const want = token();
  return got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export function checkPassword(pw) {
  const want = process.env.SITE_PASSWORD || "";
  if (!want || typeof pw !== "string") return false;
  const a = Buffer.from(pw), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sessionCookie(clear) {
  const base = `${COOKIE}=${clear ? "" : token()}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  return clear ? base + "; Max-Age=0" : base + "; Max-Age=" + 60 * 60 * 24 * 90;
}

export function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  res.status(401).json({ error: "auth" });
  return false;
}

// Deep merge: nested objects merge, everything else (arrays, null, strings) replaces.
export function merge(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) merge(target[k], v);
    else target[k] = v;
  }
  return target;
}

export function parse(v) {
  if (v == null) return null;
  return typeof v === "string" ? JSON.parse(v) : v;
}

export const ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
