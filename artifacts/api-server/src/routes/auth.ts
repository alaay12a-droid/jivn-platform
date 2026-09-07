import { getAuth } from "@clerk/express";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const ADMIN_UNLOCK_COOKIE = "jivn_admin_unlock";
const ADMIN_UNLOCK_TTL_MS = 1000 * 60 * 60 * 12;

function signature(value: string) {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function sameSecret(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function cookieValue(req: Request) {
  const raw = req.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${ADMIN_UNLOCK_COOKIE}=`));
  return raw?.slice(ADMIN_UNLOCK_COOKIE.length + 1) ?? "";
}

export function hasAdminUnlockCookie(req: Request) {
  const [expiresAt, providedSignature] = cookieValue(req).split(".");
  if (!expiresAt || !providedSignature || Number(expiresAt) < Date.now()) return false;
  return sameSecret(signature(expiresAt), providedSignature);
}

export function isAdminUnlockCodeValid(code: string) {
  const expected = process.env["JIVN_ADMIN_UNLOCK_CODE"];
  return Boolean(expected && code && sameSecret(code, expected));
}

export function setAdminUnlockCookie(res: Response) {
  const expiresAt = String(Date.now() + ADMIN_UNLOCK_TTL_MS);
  res.cookie(ADMIN_UNLOCK_COOKIE, `${expiresAt}.${signature(expiresAt)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: ADMIN_UNLOCK_TTL_MS,
    path: "/",
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth.userId && !hasAdminUnlockCookie(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}