import {
  CreateAdminPlanBody,
  CreateAdminRestaurantBody,
  GetAdminLeadsQueryParams,
  UpdateAdminContentBody,
  UpdateAdminLeadBody,
  UpdateAdminPlanBody,
  UpdateAdminPlanParams,
  UpdateAdminRestaurantBody,
  UpdateAdminRestaurantParams,
  DeleteAdminLeadParams,
  DeleteAdminPlanParams,
  DeleteAdminRestaurantParams,
  CreateAdminNotificationBody,
  UpdateAdminNotificationBody,
  UpdateAdminNotificationParams,
  DeleteAdminNotificationParams,
  CreateAdminMediaBody,
  UpdateAdminMediaBody,
  UpdateAdminMediaParams,
  DeleteAdminMediaParams,
  UpdateAdminOrderCounterBody,
  UpdateAdminContactBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  contactSettingsTable,
  leadsTable,
  notificationTable,
  pricingPlansTable,
  restaurantLogosTable,
  siteContentTable,
  siteMediaTable,
} from "@workspace/db";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { requireAdmin } from "./auth";
import { ensureSeeded } from "./seed";
import { getMarketingOrderCounter, updateMarketingOrderCounter } from "./marketing-counter";

const router: IRouter = Router();
router.use(requireAdmin);

router.get("/admin/overview", async (_req: Request, res: Response) => {
  const rows = await db.select({ status: leadsTable.status, count: sql<number>`count(*)` }).from(leadsTable).groupBy(leadsTable.status);
  const counts = Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
  res.json({
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    new: counts.New ?? 0,
    contacted: counts.Contacted ?? 0,
    inProgress: counts["In Progress"] ?? 0,
    completed: counts.Completed ?? 0,
    cancelled: counts.Cancelled ?? 0,
  });
});

router.get("/admin/content", async (_req: Request, res: Response) => {
  await ensureSeeded();
  const [content] = await db.select().from(siteContentTable).limit(1);
  res.json(content);
});

router.patch("/admin/content", async (req: Request, res: Response) => {
  await ensureSeeded();
  const parsed = UpdateAdminContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات المحتوى غير صالحة" });
    return;
  }
  const [current] = await db.select().from(siteContentTable).limit(1);
  const [content] = await db.update(siteContentTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(siteContentTable.id, current.id)).returning();
  res.json(content);
});

router.get("/admin/contact", async (_req: Request, res: Response) => {
  await ensureSeeded();
  const [contact] = await db.select().from(contactSettingsTable).limit(1);
  res.json(contact);
});

router.patch("/admin/contact", async (req: Request, res: Response) => {
  await ensureSeeded();
  const parsed = UpdateAdminContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات التواصل غير صالحة" });
    return;
  }
  const [current] = await db.select().from(contactSettingsTable).limit(1);
  const [contact] = await db.update(contactSettingsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(contactSettingsTable.id, current.id)).returning();
  res.json(contact);
});

router.get("/admin/order-counter", async (_req: Request, res: Response) => {
  await ensureSeeded();
  res.json(await getMarketingOrderCounter());
});

router.patch("/admin/order-counter", async (req: Request, res: Response) => {
  await ensureSeeded();
  const parsed = UpdateAdminOrderCounterBody.safeParse(req.body);
  if (!parsed.success || parsed.data.minDailyIncrease > parsed.data.maxDailyIncrease) {
    res.status(400).json({ error: "إعدادات عداد الطلبات غير صالحة" });
    return;
  }
  const counter = await updateMarketingOrderCounter(parsed.data);
  res.json(counter);
});

router.get("/admin/notifications", async (_req: Request, res: Response) => {
  await ensureSeeded();
  res.json(await db.select().from(notificationTable).orderBy(asc(notificationTable.sortOrder)));
});

router.post("/admin/notifications", async (req: Request, res: Response) => {
  const parsed = CreateAdminNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الإشعار غير صالحة" });
    return;
  }
  const [notification] = await db.insert(notificationTable).values(parsed.data).returning();
  res.status(201).json(notification);
});

router.patch("/admin/notifications/:id", async (req: Request, res: Response) => {
  const params = UpdateAdminNotificationParams.safeParse(req.params);
  const body = UpdateAdminNotificationBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات الإشعار غير صالحة" });
    return;
  }
  const [notification] = await db.update(notificationTable).set({ ...body.data, updatedAt: new Date() }).where(eq(notificationTable.id, params.data.id)).returning();
  if (!notification) {
    res.status(404).json({ error: "الإشعار غير موجود" });
    return;
  }
  res.json(notification);
});

router.delete("/admin/notifications/:id", async (req: Request, res: Response) => {
  const params = DeleteAdminNotificationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  await db.delete(notificationTable).where(eq(notificationTable.id, params.data.id));
  res.status(204).end();
});

router.get("/admin/media", async (_req: Request, res: Response) => {
  await ensureSeeded();
  res.json(await db.select().from(siteMediaTable).orderBy(asc(siteMediaTable.sortOrder)));
});

router.post("/admin/media", async (req: Request, res: Response) => {
  const parsed = CreateAdminMediaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الصورة غير صالحة" });
    return;
  }
  const [media] = await db.insert(siteMediaTable).values(parsed.data).returning();
  res.status(201).json(media);
});

router.patch("/admin/media/:id", async (req: Request, res: Response) => {
  const params = UpdateAdminMediaParams.safeParse(req.params);
  const body = UpdateAdminMediaBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات الصورة غير صالحة" });
    return;
  }
  const [media] = await db.update(siteMediaTable).set({ ...body.data, updatedAt: new Date() }).where(eq(siteMediaTable.id, params.data.id)).returning();
  if (!media) {
    res.status(404).json({ error: "الصورة غير موجودة" });
    return;
  }
  res.json(media);
});

router.delete("/admin/media/:id", async (req: Request, res: Response) => {
  const params = DeleteAdminMediaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  await db.delete(siteMediaTable).where(eq(siteMediaTable.id, params.data.id));
  res.status(204).end();
});

router.get("/admin/plans", async (_req: Request, res: Response) => {
  await ensureSeeded();
  res.json(await db.select().from(pricingPlansTable).orderBy(asc(pricingPlansTable.sortOrder)));
});

router.post("/admin/plans", async (req: Request, res: Response) => {
  const parsed = CreateAdminPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الباقة غير صالحة" });
    return;
  }
  const [plan] = await db.insert(pricingPlansTable).values(parsed.data).returning();
  res.status(201).json(plan);
});

router.patch("/admin/plans/:id", async (req: Request, res: Response) => {
  const params = UpdateAdminPlanParams.safeParse(req.params);
  const body = UpdateAdminPlanBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات الباقة غير صالحة" });
    return;
  }
  const [plan] = await db.update(pricingPlansTable).set({ ...body.data, updatedAt: new Date() }).where(eq(pricingPlansTable.id, params.data.id)).returning();
  if (!plan) {
    res.status(404).json({ error: "الباقة غير موجودة" });
    return;
  }
  res.json(plan);
});

router.delete("/admin/plans/:id", async (req: Request, res: Response) => {
  const params = DeleteAdminPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  await db.delete(pricingPlansTable).where(eq(pricingPlansTable.id, params.data.id));
  res.status(204).end();
});

router.get("/admin/restaurants", async (_req: Request, res: Response) => {
  await ensureSeeded();
  res.json(await db.select().from(restaurantLogosTable).orderBy(asc(restaurantLogosTable.sortOrder)));
});

router.post("/admin/restaurants", async (req: Request, res: Response) => {
  const parsed = CreateAdminRestaurantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات المطعم غير صالحة" });
    return;
  }
  const [restaurant] = await db.insert(restaurantLogosTable).values(parsed.data).returning();
  res.status(201).json(restaurant);
});

router.patch("/admin/restaurants/:id", async (req: Request, res: Response) => {
  const params = UpdateAdminRestaurantParams.safeParse(req.params);
  const body = UpdateAdminRestaurantBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات المطعم غير صالحة" });
    return;
  }
  const [restaurant] = await db.update(restaurantLogosTable).set({ ...body.data, updatedAt: new Date() }).where(eq(restaurantLogosTable.id, params.data.id)).returning();
  if (!restaurant) {
    res.status(404).json({ error: "المطعم غير موجود" });
    return;
  }
  res.json(restaurant);
});

router.delete("/admin/restaurants/:id", async (req: Request, res: Response) => {
  const params = DeleteAdminRestaurantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  await db.delete(restaurantLogosTable).where(eq(restaurantLogosTable.id, params.data.id));
  res.status(204).end();
});

router.get("/admin/leads", async (req: Request, res: Response) => {
  const parsed = GetAdminLeadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "فلاتر غير صالحة" });
    return;
  }
  const filters = [];
  if (parsed.data.status) filters.push(eq(leadsTable.status, parsed.data.status));
  if (parsed.data.search) {
    const pattern = `%${parsed.data.search}%`;
    filters.push(or(ilike(leadsTable.customerName, pattern), ilike(leadsTable.restaurantName, pattern), ilike(leadsTable.phone, pattern))!);
  }
  const leads = await db.select().from(leadsTable).where(filters.length ? and(...filters) : undefined).orderBy(desc(leadsTable.createdAt));
  res.json(leads);
});

router.patch("/admin/leads/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = UpdateAdminLeadBody.safeParse(req.body);
  if (!Number.isInteger(id) || !body.success) {
    res.status(400).json({ error: "بيانات الحالة غير صالحة" });
    return;
  }
  const [lead] = await db.update(leadsTable).set(body.data).where(eq(leadsTable.id, id)).returning();
  if (!lead) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  res.json(lead);
});

router.delete("/admin/leads/:id", async (req: Request, res: Response) => {
  const params = DeleteAdminLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  await db.delete(leadsTable).where(eq(leadsTable.id, params.data.id));
  res.status(204).end();
});

export default router;