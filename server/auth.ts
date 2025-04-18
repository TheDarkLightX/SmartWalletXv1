import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Extend the session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
  }
}

const SALT_ROUNDS = 12;

/**
 * Securely hash a password using bcrypt
 * @param password The plaintext password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a hashed password
 * @param plaintext The plaintext password to check
 * @param hashed The hashed password to compare against
 * @returns A promise that resolves to a boolean indicating if the passwords match
 */
export async function comparePasswords(plaintext: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(plaintext, hashed);
}

/**
 * Authentication middleware for protecting routes
 * Verifies a user is authenticated before allowing access to protected endpoints
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check for authentication token in session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  next();
}

/**
 * Authentication middleware specifically for admin routes
 * Verifies a user is authenticated and has admin privileges
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // First check if the user is authenticated
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // Then check if the user has admin privileges
  // In a real app, you would look up the user and check their role
  if (!req.session.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
}

/**
 * Register a new user with secure password hashing
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const { username, password, email } = req.body;
    
    // Validate input fields
    if (!username || !password || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, and email are required'
      });
    }
    
    // Check for existing user
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists'
      });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the user with hashed password
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      role: 'user',
      walletAddress: null
    });
    
    // Don't include password in the response
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Store user ID in session for automatic login
    if (req.session) {
      req.session.userId = newUser.id;
      req.session.isAdmin = false; // Default to non-admin
    }
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
}

/**
 * Authenticate a user with password
 */
export async function loginUser(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Find the user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Compare passwords
    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      // Add login attempt tracking here if needed
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Set session data
    if (req.session) {
      req.session.userId = user.id;
      req.session.isAdmin = user.role === 'admin';
      
      // Update last login timestamp
      await storage.updateUser(user.id, { 
        lastLogin: new Date() 
      });
    }
    
    // Don't include password in the response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
}

/**
 * Log out the current user
 */
export function logoutUser(req: Request, res: Response) {
  if (req.session) {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error logging out'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

/**
 * Get the current authenticated user's information
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Get user information
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      // This shouldn't happen, but just in case
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't include password in the response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user information'
    });
  }
}

// Password reset functionality
// In a real application, this would send an email with a reset token
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // In a real app, you would:
    // 1. Find the user by email
    // 2. Generate a secure reset token
    // 3. Store the token with an expiration time
    // 4. Send an email with a link containing the token
    
    // For this demo, we'll just acknowledge the request
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link will be sent'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request'
    });
  }
}

// Implement the reset endpoint that would validate the token and update the password
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    // In a real app, you would:
    // 1. Validate the token and check if it's expired
    // 2. Find the user associated with the token
    // 3. Hash the new password
    // 4. Update the user's password
    // 5. Invalidate the token
    
    // For this demo, we'll just acknowledge the request
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
}