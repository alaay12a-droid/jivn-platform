import { Router, type IRouter, type Request, type Response } from "express";
import { ADMIN_UNLOCK_COOKIE, hasAdminUnlockCookie, isAdminUnlockCodeValid, setAdminUnlockCookie } from "./auth";

const router: IRouter = Router();

router.post("/admin/unlock", (req: Request, res: Response) => {
  if (!process.env["JIVN_ADMIN_UNLOCK_CODE"] || !process.env["SESSION_SECRET"]) {
    res.status(503).json({ error: "Admin unlock is not configured" });
    return;
  }
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  if (!isAdminUnlockCodeValid(code)) {
    res.status(401).json({ error: "رمز الإدارة غير صحيح" });
    return;
  }
  setAdminUnlockCookie(res);
  res.json({ unlocked: true });
});

router.get("/admin/access", (req: Request, res: Response) => {
  res.json({ unlocked: hasAdminUnlockCookie(req) });
});

router.delete("/admin/unlock", (_req: Request, res: Response) => {
  const cookieOptions = { httpOnly: true, sameSite: "strict" as const, secure: process.env["NODE_ENV"] === "production" };
  res.clearCookie(ADMIN_UNLOCK_COOKIE, { ...cookieOptions, path: "/" });
  res.clearCookie(ADMIN_UNLOCK_COOKIE, { ...cookieOptions, path: "/api" });
  res.status(204).end();
});

export default router;