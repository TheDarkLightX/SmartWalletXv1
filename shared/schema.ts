import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  email: text("email"),
  role: text("role").default("user"), // 'user', 'admin'
  securityScore: integer("security_score").default(0),
  is2faEnabled: boolean("is_2fa_enabled").default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow()
});

// Wallet schema
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  address: text("address").notNull().unique(),
  privateKey: text("private_key"), // This would be encrypted in a real implementation
  balance: text("balance").default("0"),
  network: text("network").default("ethereum"),
  createdAt: timestamp("created_at").defaultNow()
});

// Transactions schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  type: text("type").notNull(), // 'send', 'receive', 'swap'
  amount: text("amount").notNull(),
  fromAsset: text("from_asset").notNull(),
  toAsset: text("to_asset"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  hash: text("hash"),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  isPrivate: boolean("is_private").default(false),
  timestamp: timestamp("timestamp").defaultNow()
});

// Assets schema
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  balance: text("balance").notNull(),
  value: text("value").notNull(),
  priceChange: text("price_change"),
  lastUpdated: timestamp("last_updated").defaultNow()
});

// Strategies schema
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'dca', 'liquidity', 'custom', 'ai-generated'
  conditions: jsonb("conditions"), // JSON object with strategy conditions
  actions: jsonb("actions"), // JSON object with strategy actions
  schedule: text("schedule"), // CRON expression or null for event-based
  isActive: boolean("is_active").default(true),
  lastExecuted: timestamp("last_executed"),
  nextExecution: timestamp("next_execution"),
  createdAt: timestamp("created_at").defaultNow()
});

// Social recovery guardians schema
export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  guardianAddress: text("guardian_address").notNull(),
  guardianName: text("guardian_name"),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// AI strategy conversations schema
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  conversation: jsonb("conversation").notNull(), // Array of messages
  result: jsonb("result"), // Strategy generated from the conversation
  createdAt: timestamp("created_at").defaultNow()
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  walletAddress: true,
  lastLogin: true
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userId: true,
  address: true,
  network: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  walletId: true,
  type: true,
  amount: true,
  fromAsset: true,
  toAsset: true,
  fromAddress: true,
  toAddress: true,
  hash: true,
  status: true,
  isPrivate: true,
});

export const insertAssetSchema = createInsertSchema(assets).pick({
  userId: true,
  walletId: true,
  symbol: true,
  name: true,
  balance: true,
  value: true,
  priceChange: true,
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  userId: true,
  walletId: true,
  name: true,
  description: true,
  type: true,
  conditions: true,
  actions: true,
  schedule: true,
  isActive: true,
});

export const insertGuardianSchema = createInsertSchema(guardians).pick({
  userId: true,
  walletId: true,
  guardianAddress: true,
  guardianName: true,
  email: true,
  isActive: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).pick({
  userId: true,
  conversation: true,
  result: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = typeof strategies.$inferSelect;

export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type Guardian = typeof guardians.$inferSelect;

export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
