import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteContentTable = pgTable("site_content", {
  id: serial("id").primaryKey(),
  heroTitle: text("hero_title").notNull(),
  heroDescription: text("hero_description").notNull(),
  primaryCta: text("primary_cta").notNull(),
  secondaryCta: text("secondary_cta").notNull(),
  featuresTitle: text("features_title").notNull(),
  howTitle: text("how_title").notNull(),
  workTitle: text("work_title").notNull(),
  pricingTitle: text("pricing_title").notNull(),
  whyTitle: text("why_title").notNull(),
  finalCta: text("final_cta").notNull(),
  finalCtaButton: text("final_cta_button").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureTable = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
}, (table) => [uniqueIndex("features_title_unique").on(table.title)]);

export const contactSettingsTable = pgTable("contact_settings", {
  id: serial("id").primaryKey(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  instagram: text("instagram").notNull().default(""),
  twitter: text("twitter").notNull().default(""),
  tiktok: text("tiktok").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTable = pgTable("site_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  linkText: text("link_text").notNull().default(""),
  linkUrl: text("link_url").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteMediaTable = pgTable("site_media", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mediaPath: text("media_path").notNull(),
  altText: text("alt_text").notNull().default(""),
  placement: text("placement").notNull().default("gallery"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketingOrderCounterTable = pgTable("marketing_order_counter", {
  id: integer("id").primaryKey().default(1),
  currentValue: integer("current_value").notNull().default(12500),
  minDailyIncrease: integer("min_daily_increase").notNull().default(8),
  maxDailyIncrease: integer("max_daily_increase").notNull().default(24),
  dailyIncrease: integer("daily_increase").notNull().default(16),
  enabled: boolean("enabled").notNull().default(true),
  cycleStartedAt: timestamp("cycle_started_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSiteContentSchema = createInsertSchema(siteContentTable).omit({ id: true, updatedAt: true });
export const insertFeatureSchema = createInsertSchema(featureTable).omit({ id: true });
export const insertContactSettingsSchema = createInsertSchema(contactSettingsTable).omit({ id: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notificationTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSiteMediaSchema = createInsertSchema(siteMediaTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketingOrderCounterSchema = createInsertSchema(marketingOrderCounterTable).omit({ updatedAt: true });

export type SiteContent = typeof siteContentTable.$inferSelect;
export type Feature = typeof featureTable.$inferSelect;
export type ContactSettings = typeof contactSettingsTable.$inferSelect;
export type Notification = typeof notificationTable.$inferSelect;
export type SiteMedia = typeof siteMediaTable.$inferSelect;
export type MarketingOrderCounter = typeof marketingOrderCounterTable.$inferSelect;
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type InsertContactSettings = z.infer<typeof insertContactSettingsSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertSiteMedia = z.infer<typeof insertSiteMediaSchema>;
export type InsertMarketingOrderCounter = z.infer<typeof insertMarketingOrderCounterSchema>;