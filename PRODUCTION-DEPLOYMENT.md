# SecureWallet Production Deployment Guide

This guide provides detailed instructions for deploying SecureWallet to production environments. Given the security-critical nature of the application, special attention must be paid to security best practices.

## Prerequisites

Before deploying to production, ensure you have:

- Completed security audits (both automated and manual)
- Tested all features thoroughly
- Prepared necessary API keys and secrets
- Set up monitoring and alerting
- Established a backup strategy
- Created a rollback plan

## Environment Preparation

1. **Create Production Environment Variables**

   Create a `.env.production` file with production-specific values:

   ```
   NODE_ENV=production
   PORT=443
   SESSION_SECRET=<strong-random-value>
   
   # Blockchain RPC Endpoints
   ETH_MAINNET_RPC=https://mainnet.infura.io/v3/<your-infura-key>
   PULSE_MAINNET_RPC=https://rpc.pulsechain.com
   
   # Security Settings
   CSRF_SECRET=<strong-random-value>
   REQUIRE_TWO_FACTOR=true
   HARDWARE_WALLET_REQUIRED=false
   
   # Tokenomics Configuration
   DEVELOPER_FUND_ADDRESS=0x3bE00923dF0D7fb06f79fc0628525b855797d8F8
   FEE_PERCENTAGE=0.002
   DEVELOPER_FUND_PERCENTAGE=0.25
   BUY_BURN_PERCENTAGE=0.75
   ```

   NEVER commit this file to version control.

2. **Set Up a CI/CD Pipeline**

   Configure your CI/CD pipeline to:
   - Run tests
   - Perform security checks
   - Build the application
   - Deploy to staging first, then production
   - Set appropriate environment variables

## Deployment Options

### Option 1: Dedicated Virtual Private Server (VPS)

For maximum control and security, a dedicated VPS is recommended.

1. **Server Setup**

   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js and npm
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx as a reverse proxy
   sudo apt install -y nginx
   
   # Install certbot for SSL
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/securewallet.git
   cd securewallet
   ```

3. **Install Dependencies and Build**

   ```bash
   npm ci
   npm run build
   ```

4. **Set Environment Variables**

   Copy your `.env.production` file to the server.

5. **Configure Nginx**

   Create a file at `/etc/nginx/sites-available/securewallet.conf`:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
   
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site and get SSL certificate:

   ```bash
   sudo ln -s /etc/nginx/sites-available/securewallet.conf /etc/nginx/sites-enabled/
   sudo certbot --nginx -d yourdomain.com
   sudo systemctl restart nginx
   ```

6. **Start the Application with PM2**

   ```bash
   pm2 start npm --name "securewallet" -- start
   pm2 save
   pm2 startup
   ```

### Option 2: Docker Deployment

For containerized deployment with easier scalability:

1. **Create a Dockerfile**

   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 5000
   
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**

   ```yaml
   version: '3'
   
   services:
     app:
       build: .
       restart: always
       ports:
         - "5000:5000"
       env_file:
         - .env.production
       volumes:
         - app-data:/app/data
   
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/conf.d/default.conf
         - ./certbot/conf:/etc/letsencrypt
         - ./certbot/www:/var/www/certbot
       depends_on:
         - app
   
     certbot:
       image: certbot/certbot
       volumes:
         - ./certbot/conf:/etc/letsencrypt
         - ./certbot/www:/var/www/certbot
       command: certonly --webroot --webroot-path=/var/www/certbot --email info@yourdomain.com --agree-tos --no-eff-email -d yourdomain.com
   
   volumes:
     app-data:
   ```

3. **Deploy with Docker Compose**

   ```bash
   docker-compose up -d
   ```

### Option 3: Serverless Deployment

For maximum scalability with minimal maintenance:

1. **AWS Lambda + API Gateway**

   - Use the Serverless Framework to deploy to AWS Lambda
   - Set up API Gateway for HTTP endpoints
   - Use DynamoDB for session storage
   - Set up CloudFront for CDN

   Example `serverless.yml`:

   ```yaml
   service: securewallet
   
   provider:
     name: aws
     runtime: nodejs18.x
     region: us-east-1
     environment:
       NODE_ENV: production
       # Add other environment variables here
   
   functions:
     app:
       handler: server/lambda.handler
       events:
         - http:
             path: /{proxy+}
             method: any
             cors: true
   ```

2. **Vercel or Netlify**

   For frontend-heavy applications:
   
   - Deploy the frontend to Vercel or Netlify
   - Deploy the API as serverless functions
   - Set up environment variables in the platform dashboard

   Example `vercel.json`:

   ```json
   {
     "version": 2,
     "builds": [
       { "src": "client/package.json", "use": "@vercel/static-build" },
       { "src": "server/index.ts", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "server/index.ts" },
       { "src": "/(.*)", "dest": "client/build/$1" }
     ]
   }
   ```

## Cross-Platform Production Deployment

For deploying browser extensions and mobile apps to their respective stores:

### Browser Extension

1. **Chrome Web Store**
   - Build the extension: `node build-platforms.js extension production`
   - Create a developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Upload the extension ZIP file
   - Provide store listing information, screenshots, and privacy policy
   - Submit for review

2. **Firefox Add-ons**
   - Build the extension: `node build-platforms.js extension production`
   - Create a developer account at [Firefox Add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/)
   - Upload the extension ZIP file
   - Provide listing information
   - Submit for review

### Mobile Apps

1. **Android (Google Play Store)**
   - Build the Android app: `node build-platforms.js android production`
   - Create a developer account on [Google Play Console](https://play.google.com/console/about/)
   - Create a new application
   - Upload APK or Android App Bundle
   - Complete store listing, content rating
   - Submit for review

2. **iOS (Apple App Store)**
   - Build the iOS app: `node build-platforms.js ios production`
   - Create a developer account on [Apple Developer Program](https://developer.apple.com/programs/)
   - Create a new application in App Store Connect
   - Upload build through Xcode or Transporter
   - Complete App Store listing information
   - Submit for review

## Security Best Practices for Production

1. **Enable Security Headers**
   - HTTPS with HSTS
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection

2. **Rate Limiting**
   - Implement API rate limiting
   - Add protection against brute force attacks

3. **Monitoring and Alerting**
   - Set up application monitoring (e.g., Sentry, New Relic)
   - Configure alerts for security events
   - Log all authentication attempts

4. **Regular Updates**
   - Schedule regular dependency updates
   - Apply security patches promptly
   - Maintain a vulnerability disclosure policy

5. **Backup Strategy**
   - Regular database backups
   - Offsite backup storage
   - Backup testing and restoration drills

6. **Disaster Recovery Plan**
   - Document recovery procedures
   - Establish an incident response team
   - Conduct regular drills

## Maintenance

After deployment, establish a routine for:

1. **Regular security audits**
2. **Performance monitoring**
3. **User feedback collection and analysis**
4. **Feature updates**
5. **Dependency updates**

## Emergency Contacts

Establish an emergency contact list for:
- Domain registrar
- Hosting provider
- Critical service providers

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web3 Security Best Practices](https://github.com/ConsenSys/smart-contract-best-practices)
- [Security Considerations for Browser Extensions](https://developer.chrome.com/docs/extensions/mv3/security/)
- [Mobile App Security Checklist](https://github.com/OWASP/owasp-mstg)