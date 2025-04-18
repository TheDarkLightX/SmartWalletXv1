#!/usr/bin/env node

/**
 * SecureWallet GitHub Repository Setup Script
 * 
 * This script helps set up the repository on GitHub.
 */

import readline from 'readline';
import { execSync } from 'child_process';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('🔧 SecureWallet GitHub Repository Setup Tool');
  console.log('==========================================\n');
  
  try {
    const repoUrl = await promptGitHubUrl();
    
    // Check if git is initialized
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      console.log('✅ Git repository already initialized.');
    } catch (error) {
      console.log('Initializing git repository...');
      execSync('git init', { stdio: 'inherit' });
      console.log('✅ Git repository initialized.');
    }
    
    // Add remote
    try {
      execSync('git remote -v', { stdio: 'ignore' });
      console.log('Remote repository already exists. Updating...');
      execSync(`git remote set-url origin ${repoUrl}`, { stdio: 'inherit' });
    } catch (error) {
      console.log('Adding remote repository...');
      execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
    }
    
    console.log('✅ Remote repository set to:', repoUrl);
    
    // Add all files
    console.log('Adding all files to git...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Commit files
    const commitMessage = await promptCommitMessage();
    console.log('Committing files...');
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // Push to remote
    const shouldPush = await promptPush();
    if (shouldPush) {
      console.log('Pushing to remote repository...');
      try {
        execSync('git push -u origin main', { stdio: 'inherit' });
      } catch (error) {
        console.log('Failed to push to main branch. The branch might not exist yet.');
        console.log('Trying to push to master branch instead...');
        execSync('git push -u origin master', { stdio: 'inherit' });
      }
      console.log('✅ Code pushed to remote repository.');
    }
    
    console.log('\n✅ GitHub repository setup completed!');
    
  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function promptGitHubUrl() {
  return new Promise((resolve) => {
    rl.question('Enter your GitHub repository URL (e.g., https://github.com/username/securewallet.git): ', (answer) => {
      if (!answer) {
        console.log('No URL provided. Please create a repository on GitHub first.');
        process.exit(1);
      }
      resolve(answer);
    });
  });
}

function promptCommitMessage() {
  return new Promise((resolve) => {
    rl.question('Enter commit message [Initial commit]: ', (answer) => {
      resolve(answer || 'Initial commit');
    });
  });
}

function promptPush() {
  return new Promise((resolve) => {
    rl.question('Push to remote repository now? (Y/n): ', (answer) => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
}

// Run the script
main().catch(console.error);