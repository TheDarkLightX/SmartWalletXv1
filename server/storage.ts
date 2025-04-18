import {
  users, type User, type InsertUser,
  wallets, type Wallet, type InsertWallet,
  transactions, type Transaction, type InsertTransaction,
  assets, type Asset, type InsertAsset,
  strategies, type Strategy, type InsertStrategy,
  guardians, type Guardian, type InsertGuardian,
  aiConversations, type AiConversation, type InsertAiConversation
} from "@shared/schema";

// Storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  // Wallet operations
  getWallet(id: number): Promise<Wallet | undefined>;
  getWalletByAddress(address: string): Promise<Wallet | undefined>;
  getWalletsByUserId(userId: number): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, walletData: Partial<Wallet>): Promise<Wallet | undefined>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByWalletId(walletId: number): Promise<Transaction[]>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined>;

  // Asset operations
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetsByWalletId(walletId: number): Promise<Asset[]>;
  getAssetsByUserId(userId: number): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, assetData: Partial<Asset>): Promise<Asset | undefined>;

  // Strategy operations
  getStrategy(id: number): Promise<Strategy | undefined>;
  getStrategiesByWalletId(walletId: number): Promise<Strategy[]>;
  getStrategiesByUserId(userId: number): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, strategyData: Partial<Strategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: number): Promise<boolean>;

  // Guardian operations
  getGuardian(id: number): Promise<Guardian | undefined>;
  getGuardiansByWalletId(walletId: number): Promise<Guardian[]>;
  getGuardiansByUserId(userId: number): Promise<Guardian[]>;
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;
  updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined>;
  deleteGuardian(id: number): Promise<boolean>;

  // AI Conversation operations
  getAiConversation(id: number): Promise<AiConversation | undefined>;
  getAiConversationsByUserId(userId: number): Promise<AiConversation[]>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  updateAiConversation(id: number, conversationData: Partial<AiConversation>): Promise<AiConversation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private assets: Map<number, Asset>;
  private strategies: Map<number, Strategy>;
  private guardians: Map<number, Guardian>;
  private aiConversations: Map<number, AiConversation>;
  
  private userCurrentId: number;
  private walletCurrentId: number;
  private transactionCurrentId: number;
  private assetCurrentId: number;
  private strategyCurrentId: number;
  private guardianCurrentId: number;
  private aiConversationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.assets = new Map();
    this.strategies = new Map();
    this.guardians = new Map();
    this.aiConversations = new Map();
    
    this.userCurrentId = 1;
    this.walletCurrentId = 1;
    this.transactionCurrentId = 1;
    this.assetCurrentId = 1;
    this.strategyCurrentId = 1;
    this.guardianCurrentId = 1;
    this.aiConversationCurrentId = 1;
    
    // Add some initial data
    this.initializeData();
  }

  // Initialize with some sample data for development
  private initializeData() {
    // Create a sample user
    const user: User = {
      id: this.userCurrentId++,
      username: 'alexmorgan',
      password: 'hashed_password',
      walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      email: 'alex@example.com',
      securityScore: 85,
      is2faEnabled: true,
      createdAt: new Date()
    };
    this.users.set(user.id, user);

    // Create a wallet
    const wallet: Wallet = {
      id: this.walletCurrentId++,
      userId: user.id,
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      privateKey: 'encrypted_private_key',
      balance: '3.24',
      network: 'ethereum',
      createdAt: new Date()
    };
    this.wallets.set(wallet.id, wallet);

    // Create some assets
    const assets: InsertAsset[] = [
      {
        userId: user.id,
        walletId: wallet.id,
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '3.24',
        value: '6254.32',
        priceChange: '+2.4%',
      },
      {
        userId: user.id,
        walletId: wallet.id,
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '1250',
        value: '1250.00',
        priceChange: '0%',
      },
      {
        userId: user.id,
        walletId: wallet.id,
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        balance: '0.025',
        value: '856.27',
        priceChange: '-0.8%',
      }
    ];

    assets.forEach(asset => {
      const newAsset: Asset = {
        ...asset,
        id: this.assetCurrentId++,
        lastUpdated: new Date()
      };
      this.assets.set(newAsset.id, newAsset);
    });

    // Create some transactions
    const transactions: InsertTransaction[] = [
      {
        userId: user.id,
        walletId: wallet.id,
        type: 'receive',
        amount: '0.5',
        fromAsset: 'ETH',
        toAsset: 'ETH',
        fromAddress: '0x8ae5b83f474adce2c60c9dfeade9769ede12ddad',
        toAddress: wallet.address,
        hash: '0x2387c0ee7b64fdb714585938df5910e51740a2bb3e83950ffe13c868f5f9b33d',
        status: 'completed',
        isPrivate: false,
      },
      {
        userId: user.id,
        walletId: wallet.id,
        type: 'swap',
        amount: '0.2',
        fromAsset: 'ETH',
        toAsset: 'USDC',
        fromAddress: wallet.address,
        toAddress: wallet.address,
        hash: '0x1ec9de9e0024e4cc81ca0a29b2ad9f6e63e9be63a9c329eb61abba35db5006a3',
        status: 'completed',
        isPrivate: false,
      },
      {
        userId: user.id,
        walletId: wallet.id,
        type: 'send',
        amount: '0.1',
        fromAsset: 'ETH',
        toAsset: 'ETH',
        fromAddress: wallet.address,
        toAddress: '0x3e87FEc7A1f783267D51F4C79511D76336d26873',
        hash: '0x9bc1a5f389c92ac6a8e96d42391d827ebf3516e3dc67e29fcb0ef6d09faa2cb8',
        status: 'completed',
        isPrivate: true,
      }
    ];

    transactions.forEach(transaction => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 5));
      
      const newTransaction: Transaction = {
        ...transaction,
        id: this.transactionCurrentId++,
        timestamp: date
      };
      this.transactions.set(newTransaction.id, newTransaction);
    });

    // Create some strategies
    const strategies: InsertStrategy[] = [
      {
        userId: user.id,
        walletId: wallet.id,
        name: 'DCA ETH Strategy',
        description: 'Buy $50 of ETH every Monday at 9:00 AM',
        type: 'dca',
        conditions: { day: 'Monday', time: '09:00', amount: 50 },
        actions: { buy: 'ETH', amount: 50 },
        schedule: '0 9 * * 1', // CRON expression for Monday at 9am
        isActive: true,
      },
      {
        userId: user.id,
        walletId: wallet.id,
        name: 'AI-Generated Liquidity Strategy',
        description: 'Provide liquidity to ETH/USDC when volatility < 2%',
        type: 'ai-generated',
        conditions: { volatility: '< 2%' },
        actions: { provideLiquidity: { pair: 'ETH/USDC', amount: '0.1 ETH' } },
        schedule: null, // Event-based
        isActive: true,
      }
    ];

    strategies.forEach(strategy => {
      const nextExec = new Date();
      nextExec.setDate(nextExec.getDate() + 3); // Set next execution a few days ahead
      
      const newStrategy: Strategy = {
        ...strategy,
        id: this.strategyCurrentId++,
        lastExecuted: null,
        nextExecution: nextExec,
        createdAt: new Date()
      };
      this.strategies.set(newStrategy.id, newStrategy);
    });

    // Create some guardians
    const guardians: InsertGuardian[] = [
      {
        userId: user.id,
        walletId: wallet.id,
        guardianAddress: '0x6Bb4F7E3c17824138A0889F91d75Cc1b1b7bEF9C',
        guardianName: 'John Smith',
        email: 'john@example.com',
        isActive: true,
      },
      {
        userId: user.id,
        walletId: wallet.id,
        guardianAddress: '0x9c39Bb4F8F0FF03De87d425F39A738A9413CeF5c',
        guardianName: 'Sarah Johnson',
        email: 'sarah@example.com',
        isActive: true,
      },
      {
        userId: user.id,
        walletId: wallet.id,
        guardianAddress: '0x1a93DD02dA2c32283EA6F92703ccA6ded18b5b8a',
        guardianName: 'Mike Wilson',
        email: 'mike@example.com',
        isActive: false,
      }
    ];

    guardians.forEach(guardian => {
      const newGuardian: Guardian = {
        ...guardian,
        id: this.guardianCurrentId++,
        createdAt: new Date()
      };
      this.guardians.set(newGuardian.id, newGuardian);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      securityScore: 0,
      is2faEnabled: false,
      walletAddress: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Wallet operations
  async getWallet(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.address.toLowerCase() === address.toLowerCase()
    );
  }

  async getWalletsByUserId(userId: number): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(
      (wallet) => wallet.userId === userId
    );
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.walletCurrentId++;
    const now = new Date();
    const wallet: Wallet = { 
      ...insertWallet, 
      id,
      privateKey: 'encrypted_private_key',
      balance: '0',
      createdAt: now
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async updateWallet(id: number, walletData: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallet = this.wallets.get(id);
    if (!wallet) return undefined;
    
    const updatedWallet = { ...wallet, ...walletData };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByWalletId(walletId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.walletId === walletId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCurrentId++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      timestamp: now
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Asset operations
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  async getAssetsByWalletId(walletId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.walletId === walletId
    );
  }

  async getAssetsByUserId(userId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.userId === userId
    );
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetCurrentId++;
    const now = new Date();
    const asset: Asset = { 
      ...insertAsset, 
      id,
      lastUpdated: now
    };
    this.assets.set(id, asset);
    return asset;
  }

  async updateAsset(id: number, assetData: Partial<Asset>): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    
    const updatedAsset = { 
      ...asset, 
      ...assetData,
      lastUpdated: new Date() 
    };
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }

  // Strategy operations
  async getStrategy(id: number): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async getStrategiesByWalletId(walletId: number): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(
      (strategy) => strategy.walletId === walletId
    );
  }

  async getStrategiesByUserId(userId: number): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(
      (strategy) => strategy.userId === userId
    );
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const id = this.strategyCurrentId++;
    const now = new Date();
    const strategy: Strategy = { 
      ...insertStrategy, 
      id,
      lastExecuted: null,
      nextExecution: null,
      createdAt: now
    };
    this.strategies.set(id, strategy);
    return strategy;
  }

  async updateStrategy(id: number, strategyData: Partial<Strategy>): Promise<Strategy | undefined> {
    const strategy = this.strategies.get(id);
    if (!strategy) return undefined;
    
    const updatedStrategy = { ...strategy, ...strategyData };
    this.strategies.set(id, updatedStrategy);
    return updatedStrategy;
  }

  async deleteStrategy(id: number): Promise<boolean> {
    return this.strategies.delete(id);
  }

  // Guardian operations
  async getGuardian(id: number): Promise<Guardian | undefined> {
    return this.guardians.get(id);
  }

  async getGuardiansByWalletId(walletId: number): Promise<Guardian[]> {
    return Array.from(this.guardians.values()).filter(
      (guardian) => guardian.walletId === walletId
    );
  }

  async getGuardiansByUserId(userId: number): Promise<Guardian[]> {
    return Array.from(this.guardians.values()).filter(
      (guardian) => guardian.userId === userId
    );
  }

  async createGuardian(insertGuardian: InsertGuardian): Promise<Guardian> {
    const id = this.guardianCurrentId++;
    const now = new Date();
    const guardian: Guardian = { 
      ...insertGuardian, 
      id,
      createdAt: now
    };
    this.guardians.set(id, guardian);
    return guardian;
  }

  async updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined> {
    const guardian = this.guardians.get(id);
    if (!guardian) return undefined;
    
    const updatedGuardian = { ...guardian, ...guardianData };
    this.guardians.set(id, updatedGuardian);
    return updatedGuardian;
  }

  async deleteGuardian(id: number): Promise<boolean> {
    return this.guardians.delete(id);
  }

  // AI Conversation operations
  async getAiConversation(id: number): Promise<AiConversation | undefined> {
    return this.aiConversations.get(id);
  }

  async getAiConversationsByUserId(userId: number): Promise<AiConversation[]> {
    return Array.from(this.aiConversations.values())
      .filter((conv) => conv.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAiConversation(insertConversation: InsertAiConversation): Promise<AiConversation> {
    const id = this.aiConversationCurrentId++;
    const now = new Date();
    const conversation: AiConversation = { 
      ...insertConversation, 
      id,
      createdAt: now
    };
    this.aiConversations.set(id, conversation);
    return conversation;
  }

  async updateAiConversation(id: number, conversationData: Partial<AiConversation>): Promise<AiConversation | undefined> {
    const conversation = this.aiConversations.get(id);
    if (!conversation) return undefined;
    
    const updatedConversation = { ...conversation, ...conversationData };
    this.aiConversations.set(id, updatedConversation);
    return updatedConversation;
  }
}

export const storage = new MemStorage();
