import { CreateLeadBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.post("/leads", async (req: Request, res: Response) => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "تحقق من البيانات المدخلة" });
    return;
  }
  const [lead] = await db.insert(leadsTable).values(parsed.data).returning();
  res.status(201).json(lead);
});

export default router;