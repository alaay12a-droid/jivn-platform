import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pricingPlansTable = pgTable("pricing_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("SAR"),
  billingPeriod: text("billing_period").notNull(),
  description: text("description").notNull(),
  features: text("features").array().notNull().default([]),
  recommended: boolean("recommended").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPricingPlanSchema = createInsertSchema(pricingPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type PricingPlan = typeof pricingPlansTable.$inferSelect;
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;