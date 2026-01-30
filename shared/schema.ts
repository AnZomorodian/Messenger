import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userStatuses = ["online", "away", "busy", "offline"] as const;
export type UserStatus = typeof userStatuses[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  color: text("color").notNull().default("#000000"),
  status: text("status").notNull().default("online"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  replyToId: integer("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  isLocked: boolean("is_locked").default(false),
  lockedByUserId: integer("locked_by_user_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  userId: integer("user_id").notNull(),
  emoji: text("emoji").notNull(),
});

export const dmRequestStatuses = ["pending", "accepted", "rejected"] as const;
export type DMRequestStatus = typeof dmRequestStatuses[number];

export const dmRequests = pgTable("dm_requests", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  status: text("status").notNull().default("pending"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertReactionSchema = z.object({
  messageId: z.number(),
  userId: z.number(),
  emoji: z.string(),
});

export const insertDMRequestSchema = z.object({
  fromUserId: z.number(),
  toUserId: z.number(),
});

export const insertDirectMessageSchema = z.object({
  fromUserId: z.number(),
  toUserId: z.number(),
  content: z.string(),
});

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type DMRequest = typeof dmRequests.$inferSelect;
export type InsertDMRequest = z.infer<typeof insertDMRequestSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  color: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  userId: true,
  replyToId: true,
  imageUrl: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
