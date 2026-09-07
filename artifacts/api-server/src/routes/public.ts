import { db } from "@workspace/db";
import {
  contactSettingsTable,
  featureTable,
  notificationTable,
  pricingPlansTable,
  restaurantLogosTable,
  siteContentTable,
  siteMediaTable,
} from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { ensureSeeded } from "./seed";
import { getMarketingOrderCounter } from "./marketing-counter";

const router: IRouter = Router();

router.get("/public/site", async (_req: Request, res: Response) => {
  await ensureSeeded();
  const [content] = await db.select().from(siteContentTable).limit(1);
  const features = await db.select().from(featureTable).where(eq(featureTable.active, true)).orderBy(asc(featureTable.sortOrder));
  const [contact] = await db.select().from(contactSettingsTable).limit(1);
  const notifications = await db.select().from(notificationTable).where(eq(notificationTable.active, true)).orderBy(asc(notificationTable.sortOrder));
  const media = await db.select().from(siteMediaTable).where(eq(siteMediaTable.active, true)).orderBy(asc(siteMediaTable.sortOrder));
  const marketingOrderCounter = await getMarketingOrderCounter();
  res.json({
    content,
    features,
    contact,
    notifications,
    media,
    marketingOrderCounter: {
      displayedValue: marketingOrderCounter.displayedValue,
      enabled: marketingOrderCounter.enabled,
    },
  });
});

router.get("/public/pricing", async (_req: Request, res: Response) => {
  await ensureSeeded();
  const plans = await db.select().from(pricingPlansTable).where(eq(pricingPlansTable.active, true)).orderBy(asc(pricingPlansTable.sortOrder));
  res.json(plans);
});

router.get("/public/restaurants", async (_req: Request, res: Response) => {
  await ensureSeeded();
  const restaurants = await db.select().from(restaurantLogosTable).where(eq(restaurantLogosTable.active, true)).orderBy(asc(restaurantLogosTable.sortOrder));
  res.json(restaurants);
});

export default router;