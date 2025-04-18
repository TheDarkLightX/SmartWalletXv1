import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import csrf from "csurf";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { randomBytes } from "crypto";

// Extend the session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    securityTokens?: Record<string, number>;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
app.use(session({
  secret: randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// Custom Security Headers
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Set Content-Security-Policy in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy', 
      "default-src 'self'; script-src 'self'; connect-src 'self' wss:; img-src 'self' data:; style-src 'self' 'unsafe-inline'"
    );
  }
  
  next();
});

// Custom token-based request validation
app.use((req, res, next) => {
  // Skip for GET and OPTIONS requests
  if (req.method === 'GET' || req.method === 'OPTIONS') {
    // For GET requests, generate and include a security token in the response
    if (req.method === 'GET' && req.path.startsWith('/api/')) {
      const originalJsonMethod = res.json;
      res.json = function(body) {
        if (res.statusCode < 400 && typeof body === 'object' && body !== null) {
          // Generate a token valid for 1 hour
          const token = randomBytes(32).toString('hex');
          
          // Store in session
          if (req.session) {
            // Initialize securityTokens if it doesn't exist
            if (!req.session.securityTokens) {
              req.session.securityTokens = {};
            }
            
            // Set expiration 1 hour from now
            const expiryTime = Date.now() + (60 * 60 * 1000);
            
            // Safely access securityTokens
            const securityTokens = req.session.securityTokens;
            securityTokens[token] = expiryTime;
            
            // Clean up expired tokens
            Object.keys(securityTokens).forEach(key => {
              if (securityTokens[key] < Date.now()) {
                delete securityTokens[key];
              }
            });
            
            // Add token to response
            body.securityToken = token;
          }
        }
        return originalJsonMethod.call(this, body);
      };
    }
    
    next();
    return;
  }
  
  // For modifying requests (POST, PUT, DELETE), validate the token
  if (req.path.startsWith('/api/')) {
    // Skip validation for authentication endpoints
    if (req.path === '/api/login' || 
        req.path === '/api/register' || 
        req.path === '/api/signup' || 
        req.path.startsWith('/api/ws-auth')) {
      next();
      return;
    }
    
    const token = req.headers['x-security-token'] as string;
    
    // Validate token exists and is in the session
    if (!token || 
        !req.session || 
        !req.session.securityTokens || 
        !req.session.securityTokens[token] ||
        req.session.securityTokens[token] < Date.now()) {
      return res.status(403).json({ 
        message: 'Invalid or expired security token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Token is valid, remove it to prevent reuse
    delete req.session.securityTokens[token];
    
    next();
  } else {
    next();
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
