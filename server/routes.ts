import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./storage";
import { z } from "zod";
import crypto from 'crypto';
import { 
  insertUserSchema, 
  insertWalletSchema, 
  insertTransactionSchema, 
  insertAssetSchema, 
  insertStrategySchema, 
  insertGuardianSchema, 
  insertAiConversationSchema
} from "@shared/schema";

// Utility function to validate IDs in route parameters
function validatePositiveId(id: string): { valid: boolean, value?: number, message?: string } {
  if (!/^\d+$/.test(id)) {
    return { valid: false, message: "ID must be a numeric value" };
  }
  
  const numericId = parseInt(id, 10);
  if (numericId <= 0) {
    return { valid: false, message: "ID must be a positive number" };
  }
  
  return { valid: true, value: numericId };
}

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  requireAuth,
  requestPasswordReset,
  resetPassword
} from './auth';

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Authentication routes
  router.post('/register', registerUser);
  router.post('/login', loginUser);
  router.post('/logout', logoutUser);
  router.get('/current-user', getCurrentUser);
  router.post('/request-password-reset', requestPasswordReset);
  router.post('/reset-password', resetPassword);

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
      const userIdParam = req.params.id;
      // Validate id is a number
      if (!/^\d+$/.test(userIdParam)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const userId = parseInt(userIdParam);
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
      const walletIdParam = req.params.id;
      // Validate id is a number
      if (!/^\d+$/.test(walletIdParam)) {
        return res.status(400).json({ message: "Invalid wallet ID format" });
      }
      
      const walletId = parseInt(walletIdParam);
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
      const idParam = req.params.id;
      // Validate id is a positive number
      if (!/^\d+$/.test(idParam) || parseInt(idParam) <= 0) {
        return res.status(400).json({ message: "Invalid transaction ID format" });
      }
      
      const transactionId = parseInt(idParam);
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
      const idParam = req.params.walletId;
      // Validate walletId is a positive number
      if (!/^\d+$/.test(idParam) || parseInt(idParam) <= 0) {
        return res.status(400).json({ message: "Invalid wallet ID format" });
      }
      
      const walletId = parseInt(idParam);
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
      const validation = validatePositiveId(req.params.userId);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
      
      const userId = validation.value!;
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
      const validation = validatePositiveId(req.params.id);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
      
      const strategyId = validation.value!;
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
  
  // Create WebSocket server with secure configuration and path that won't conflict with Vite
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Verify client connection based on authentication
    verifyClient: (info, callback) => {
      // Simple example - in production use a more robust authentication system
      const url = info.req.url || '';
      const token = new URL(url, 'https://example.org').searchParams.get('token');
      // Verify token - in a real app, check against stored tokens
      const isValidToken = token && token.length > 20;
      
      if (!isValidToken) {
        callback(false, 401, 'Unauthorized');
        return;
      }
      
      callback(true);
    }
  });
  
  // Generate secure session tokens for WebSocket authentication
  function generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Store valid tokens (in a real app, use a more persistent storage)
  const validTokens = new Set<string>();
  
  // API endpoint to get a token for WebSocket authentication
  router.post("/ws-auth", async (req: Request, res: Response) => {
    try {
      // In a real app, verify user credentials here
      // Here we're just generating a token
      const token = generateSecureToken();
      validTokens.add(token);
      
      // Tokens expire after 1 hour
      setTimeout(() => {
        validTokens.delete(token);
      }, 60 * 60 * 1000);
      
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: "Error generating WebSocket token" });
    }
  });
  
  // WebSocket connection handler
  wss.on('connection', (ws, req) => {
    // Parse token from URL
    const url = req.url || '';
    const token = new URL(url, 'https://example.org').searchParams.get('token');
    
    // Additional security check
    if (!token || !validTokens.has(token)) {
      ws.close(1008, 'Invalid token');
      return;
    }
    
    // Handle messages with proper validation
    ws.on('message', (message) => {
      try {
        // Parse and validate the message
        const data = JSON.parse(message.toString());
        const { type, payload } = data;
        
        // Basic message type validation
        if (!type || typeof type !== 'string') {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
          return;
        }
        
        // Handle different message types
        switch (type) {
          case 'transaction_update':
            // Process transaction updates
            // In a real implementation, validate the payload thoroughly
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: 'transaction_confirmed', payload }));
            }
            break;
            
          case 'ping':
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: 'pong' }));
            }
            break;
            
          default:
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ error: 'Unknown message type' }));
            }
        }
      } catch (error) {
        // Handle parsing errors
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      // Clean up any resources when connection closes
    });
  });

  return httpServer;
}
