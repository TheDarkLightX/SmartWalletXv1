import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertWalletSchema, 
  insertTransactionSchema, 
  insertAssetSchema, 
  insertStrategySchema, 
  insertGuardianSchema, 
  insertAiConversationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // User routes
  router.post("/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  router.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Wallet routes
  router.post("/wallets", async (req: Request, res: Response) => {
    try {
      const walletData = insertWalletSchema.parse(req.body);
      const user = await storage.getUser(walletData.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newWallet = await storage.createWallet(walletData);
      
      // Update user with wallet address
      await storage.updateUser(user.id, { walletAddress: newWallet.address });
      
      res.status(201).json(newWallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid wallet data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating wallet" });
    }
  });

  router.get("/wallets/:id", async (req: Request, res: Response) => {
    try {
      const walletId = parseInt(req.params.id);
      const wallet = await storage.getWallet(walletId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.status(200).json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Error fetching wallet" });
    }
  });

  router.get("/users/:userId/wallets", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const wallets = await storage.getWalletsByUserId(userId);
      res.status(200).json(wallets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching wallets" });
    }
  });

  // Transaction routes
  router.post("/transactions", async (req: Request, res: Response) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const user = await storage.getUser(transactionData.userId);
      const wallet = await storage.getWallet(transactionData.walletId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const newTransaction = await storage.createTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating transaction" });
    }
  });

  router.get("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(200).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction" });
    }
  });

  router.get("/wallets/:walletId/transactions", async (req: Request, res: Response) => {
    try {
      const walletId = parseInt(req.params.walletId);
      const wallet = await storage.getWallet(walletId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const transactions = await storage.getTransactionsByWalletId(walletId);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  router.get("/users/:userId/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const transactions = await storage.getTransactionsByUserId(userId);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Asset routes
  router.post("/assets", async (req: Request, res: Response) => {
    try {
      const assetData = insertAssetSchema.parse(req.body);
      const user = await storage.getUser(assetData.userId);
      const wallet = await storage.getWallet(assetData.walletId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const newAsset = await storage.createAsset(assetData);
      res.status(201).json(newAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid asset data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating asset" });
    }
  });

  router.get("/wallets/:walletId/assets", async (req: Request, res: Response) => {
    try {
      const walletId = parseInt(req.params.walletId);
      const wallet = await storage.getWallet(walletId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const assets = await storage.getAssetsByWalletId(walletId);
      res.status(200).json(assets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assets" });
    }
  });

  // Strategy routes
  router.post("/strategies", async (req: Request, res: Response) => {
    try {
      const strategyData = insertStrategySchema.parse(req.body);
      const user = await storage.getUser(strategyData.userId);
      const wallet = await storage.getWallet(strategyData.walletId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const newStrategy = await storage.createStrategy(strategyData);
      res.status(201).json(newStrategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid strategy data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating strategy" });
    }
  });

  router.get("/strategies/:id", async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      res.status(200).json(strategy);
    } catch (error) {
      res.status(500).json({ message: "Error fetching strategy" });
    }
  });

  router.get("/wallets/:walletId/strategies", async (req: Request, res: Response) => {
    try {
      const walletId = parseInt(req.params.walletId);
      const wallet = await storage.getWallet(walletId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const strategies = await storage.getStrategiesByWalletId(walletId);
      res.status(200).json(strategies);
    } catch (error) {
      res.status(500).json({ message: "Error fetching strategies" });
    }
  });

  router.put("/strategies/:id", async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      const updatedStrategy = await storage.updateStrategy(strategyId, req.body);
      res.status(200).json(updatedStrategy);
    } catch (error) {
      res.status(500).json({ message: "Error updating strategy" });
    }
  });

  router.delete("/strategies/:id", async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      await storage.deleteStrategy(strategyId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting strategy" });
    }
  });

  // Guardian routes
  router.post("/guardians", async (req: Request, res: Response) => {
    try {
      const guardianData = insertGuardianSchema.parse(req.body);
      const user = await storage.getUser(guardianData.userId);
      const wallet = await storage.getWallet(guardianData.walletId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const newGuardian = await storage.createGuardian(guardianData);
      res.status(201).json(newGuardian);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid guardian data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating guardian" });
    }
  });

  router.get("/guardians/:id", async (req: Request, res: Response) => {
    try {
      const guardianId = parseInt(req.params.id);
      const guardian = await storage.getGuardian(guardianId);
      
      if (!guardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      res.status(200).json(guardian);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardian" });
    }
  });

  router.get("/wallets/:walletId/guardians", async (req: Request, res: Response) => {
    try {
      const walletId = parseInt(req.params.walletId);
      const wallet = await storage.getWallet(walletId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const guardians = await storage.getGuardiansByWalletId(walletId);
      res.status(200).json(guardians);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardians" });
    }
  });

  router.put("/guardians/:id", async (req: Request, res: Response) => {
    try {
      const guardianId = parseInt(req.params.id);
      const guardian = await storage.getGuardian(guardianId);
      
      if (!guardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      const updatedGuardian = await storage.updateGuardian(guardianId, req.body);
      res.status(200).json(updatedGuardian);
    } catch (error) {
      res.status(500).json({ message: "Error updating guardian" });
    }
  });

  router.delete("/guardians/:id", async (req: Request, res: Response) => {
    try {
      const guardianId = parseInt(req.params.id);
      const guardian = await storage.getGuardian(guardianId);
      
      if (!guardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      await storage.deleteGuardian(guardianId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting guardian" });
    }
  });

  // AI Conversation routes
  router.post("/ai-conversations", async (req: Request, res: Response) => {
    try {
      const conversationData = insertAiConversationSchema.parse(req.body);
      const user = await storage.getUser(conversationData.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newConversation = await storage.createAiConversation(conversationData);
      res.status(201).json(newConversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating AI conversation" });
    }
  });

  router.get("/users/:userId/ai-conversations", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const conversations = await storage.getAiConversationsByUserId(userId);
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching AI conversations" });
    }
  });

  // Register all routes with /api prefix
  app.use("/api", router);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
