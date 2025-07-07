import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  messages: jsonb("messages").notNull().default('[]'),
  context: jsonb("context").notNull().default('[]'),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  citations: text("citations"),
  responseId: text("response_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Zod schemas
export const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string(),
  category: z.string().optional(),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.number()
  })).optional().default([])
});

export const chatResponseSchema = z.object({
  response: z.string(),
  citations: z.string().optional(),
  responseId: z.string(),
  category: z.string().optional(),
  context: z.array(z.any())
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
