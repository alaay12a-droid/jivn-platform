import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantLogosTable = pgTable("restaurant_logos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logoPath: text("logo_path").notNull(),
  appDownloadUrl: text("app_download_url").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("restaurant_logos_name_unique").on(table.name)]);

export const insertRestaurantLogoSchema = createInsertSchema(restaurantLogosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type RestaurantLogo = typeof restaurantLogosTable.$inferSelect;
export type InsertRestaurantLogo = z.infer<typeof insertRestaurantLogoSchema>;