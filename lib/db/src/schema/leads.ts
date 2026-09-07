import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadStatusEnum = pgEnum("lead_status", ["New", "Contacted", "In Progress", "Completed", "Cancelled"]);

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  restaurantName: text("restaurant_name").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  city: text("city").notNull(),
  branches: integer("branches").notNull(),
  businessType: text("business_type").notNull(),
  packageName: text("package_name").notNull(),
  notes: text("notes").notNull().default(""),
  status: leadStatusEnum("status").notNull().default("New"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, status: true, createdAt: true });
export type Lead = typeof leadsTable.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;