# SecureWallet QuickStart Guide

This guide provides quick instructions to get your SecureWallet application up and running on GitHub and prepare it for production deployment.

> **⚠️ SECURITY DISCLAIMER ⚠️**  
> This software has not yet undergone a formal security audit. While we've implemented best practices throughout, 
> users should be aware that they are using this wallet at their own risk. We recommend starting with small amounts
> until the code has been properly audited by security professionals.

## 1. GitHub Repository Setup

### Prerequisites
- [Create a GitHub account](https://github.com/join) if you don't have one
- [Install Git](https://git-scm.com/downloads) on your local machine

### Steps

1. **Create a new repository on GitHub**
   - Go to [GitHub's New Repository page](https://github.com/new)
   - Name: `securewallet` (or your preferred name)
   - Description: "A security-focused smart contract wallet for PulseChain and Ethereum"
   - Set visibility (private is recommended during development)
   - Click "Create repository"

2. **Use our GitHub setup script**
   ```bash
   # Make the script executable (if needed)
   chmod +x github-setup.js
   
   # Run the script
   node github-setup.js
   ```
   Follow the prompts to connect your local repository to GitHub.

3. **Verify the repository**
   - Visit your GitHub repository at `https://github.com/yourusername/securewallet`
   - Confirm all files are properly uploaded

## 2. Production Deployment Options

### Option A: Digital Ocean App Platform (Recommended for simplicity)

1. **Create a Digital Ocean Account**
   - Go to [Digital Ocean](https://www.digitalocean.com/)
   - Sign up and create an account

2. **Deploy from GitHub**
   - In the Digital Ocean dashboard, click "Apps" then "Create App"
   - Choose GitHub and select your repository
   - Configure settings:
     - Environment: Node.js
     - HTTP Port: 5000
     - Add environment variables from `.env.example`
   - Click "Launch App"

### Option B: Traditional VPS (Recommended for control)

1. **Provision a VPS**
   - Use Digital Ocean, AWS, Linode, or a similar provider
   - Choose Ubuntu 22.04 or similar Linux distribution
   - Minimum specs: 2 GB RAM, 1 vCPU, 25 GB SSD

2. **Follow Production Deployment Guide**
   - See the detailed instructions in [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md)
   - Focus on the "Dedicated Virtual Private Server (VPS)" section

### Option C: Serverless (Recommended for scalability)

1. **Sign up for Vercel**
   - Go to [Vercel](https://vercel.com/signup)
   - Connect with your GitHub account

2. **Import your repository**
   - In the Vercel dashboard, click "Import Project"
   - Select your SecureWallet repository
   - Configure:
     - Framework Preset: Other
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Environment Variables: Add from `.env.example`
   - Click "Deploy"

## 3. Browser Extension Publication

1. **Run the build script for extensions**
   ```bash
   node build-platforms.js extension production
   ```

2. **Submit to Chrome Web Store**
   - Create a [Chrome Developer account](https://chrome.google.com/webstore/devconsole/)
   - Upload the extension ZIP file from `dist/extension`
   - Complete store listing information
   - Submit for review

## 4. Mobile App Publication

1. **Run the build script for mobile**
   ```bash
   # For Android
   node build-platforms.js android production
   
   # For iOS (requires macOS)
   node build-platforms.js ios production
   ```

2. **Publish to App Stores**
   - Follow the submission guidelines in [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md)

## Additional Resources

- **GitHub Documentation**: [github.docs.com](https://docs.github.com)
- **Security Audit Guide**: [AI-AUDIT-GUIDE.md](AI-AUDIT-GUIDE.md)
- **Production Deployment Guide**: [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md)
- **GitHub Repository Setup Guide**: [GITHUB-SETUP.md](GITHUB-SETUP.md)