/**
 * Secure WebSocket Client Implementation
 * 
 * This module provides a secure WebSocket client for real-time
 * transaction updates and other time-sensitive operations.
 */

import { apiRequest } from './queryClient';

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  ERROR = 4,
  AUTHENTICATING = 5,
}

// Message types for WebSocket communication
export enum MessageType {
  TRANSACTION_UPDATE = 'transaction_update',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  STRATEGY_EXECUTION = 'strategy_execution',
  PRICE_UPDATE = 'price_update',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
}

interface WebSocketMessage {
  type: MessageType;
  payload?: any;
  error?: string;
}

interface WebSocketAuthResponse {
  token: string;
}

// WebSocket client with security features
export class SecureWebSocketClient {
  private socket: WebSocket | null = null;
  private authToken: string | null = null;
  private connectionState: WebSocketState = WebSocketState.CLOSED;
  private messageHandlers: Map<MessageType, Array<(payload: any) => void>> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectInterval: number = 1000; // Start with 1 second
  private maxReconnectInterval: number = 30000; // Max 30 seconds
  private pingInterval: any = null;
  
  // Constructor with optional token
  constructor(private userId?: number) {
    // Initialize message handlers for each message type
    Object.values(MessageType).forEach(type => {
      this.messageHandlers.set(type as MessageType, []);
    });
  }
  
  // Get the current connection state
  public getState(): WebSocketState {
    return this.connectionState;
  }
  
  // Connect to the WebSocket server
  public async connect(): Promise<boolean> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return true;
    }
    
    try {
      // Set state to authenticating
      this.connectionState = WebSocketState.AUTHENTICATING;
      
      // First, authenticate to get a token
      if (!this.authToken) {
        await this.authenticate();
      }
      
      // Determine WebSocket protocol and URL
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${this.authToken}`;
      
      // Create WebSocket connection
      this.socket = new WebSocket(wsUrl);
      this.connectionState = WebSocketState.CONNECTING;
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      return new Promise<boolean>((resolve) => {
        const checkOpen = setInterval(() => {
          if (this.connectionState === WebSocketState.OPEN) {
            clearInterval(checkOpen);
            resolve(true);
          } else if (this.connectionState === WebSocketState.ERROR || 
                    this.connectionState === WebSocketState.CLOSED) {
            clearInterval(checkOpen);
            resolve(false);
          }
        }, 100);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.connectionState = WebSocketState.ERROR;
      return false;
    }
  }
  
  // Authenticate with the server to get a token
  private async authenticate(): Promise<void> {
    try {
      const response = await apiRequest(
        'POST', 
        '/api/ws-auth', 
        this.userId ? { userId: this.userId } : {}
      );
      
      const data = await response.json();
      this.authToken = data.token;
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      throw error;
    }
  }
  
  // Send a message to the server
  public send(type: MessageType, payload?: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      const message: WebSocketMessage = { type };
      if (payload !== undefined) {
        message.payload = payload;
      }
      
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }
  
  // Register a handler for a specific message type
  public on(type: MessageType, handler: (payload: any) => void): void {
    const handlers = this.messageHandlers.get(type) || [];
    handlers.push(handler);
    this.messageHandlers.set(type, handlers);
  }
  
  // Remove a handler for a specific message type
  public off(type: MessageType, handler: (payload: any) => void): void {
    const handlers = this.messageHandlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.messageHandlers.set(type, handlers);
    }
  }
  
  // Close the WebSocket connection
  public close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.connectionState = WebSocketState.CLOSED;
  }
  
  // Handle WebSocket open event
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.connectionState = WebSocketState.OPEN;
    this.reconnectAttempts = 0;
    
    // Start ping-pong for keep-alive
    this.pingInterval = setInterval(() => {
      this.send(MessageType.PING);
    }, 30000); // Every 30 seconds
  }
  
  // Handle WebSocket messages
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Invoke any registered handlers for this message type
      const handlers = this.messageHandlers.get(message.type as MessageType) || [];
      handlers.forEach(handler => {
        try {
          handler(message.payload);
        } catch (error) {
          console.error(`Error in handler for ${message.type}:`, error);
        }
      });
      
      // Special handling for error messages
      if (message.type === MessageType.ERROR && message.error) {
        console.error('WebSocket error message:', message.error);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.connectionState = WebSocketState.CLOSED;
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Attempt to reconnect with exponential backoff
    if (event.code !== 1000) { // Not a normal closure
      const delay = Math.min(
        this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
        this.maxReconnectInterval
      );
      
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }
  
  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.connectionState = WebSocketState.ERROR;
  }
}

// Create a singleton instance for application-wide use
let webSocketInstance: SecureWebSocketClient | null = null;

export function getWebSocketClient(userId?: number): SecureWebSocketClient {
  if (!webSocketInstance) {
    webSocketInstance = new SecureWebSocketClient(userId);
  }
  return webSocketInstance;
}