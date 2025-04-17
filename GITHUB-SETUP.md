# GitHub Repository Setup Guide for SecureWallet

This guide provides instructions for setting up a GitHub repository for the SecureWallet project, including repository configuration, branch protection, and CI/CD workflows.

## Repository Creation

1. **Create a new repository on GitHub**
   - Visit [GitHub](https://github.com/new)
   - Name: `securewallet` (or your preferred name)
   - Description: "A security-focused smart contract wallet leveraging multi-party computation, zero-knowledge proofs, and AI-driven security protocols."
   - Visibility: Public or Private (recommend Private during initial development)
   - Initialize with: 
     - ✅ README
     - ✅ .gitignore (Node)
     - ✅ License (MIT)

2. **Clone the repository locally**
   ```bash
   git clone https://github.com/yourusername/securewallet.git
   cd securewallet
   ```

3. **Copy project files to the cloned repository**
   ```bash
   # From your existing project directory
   cp -r * /path/to/cloned/repo/
   cp -r .env.example /path/to/cloned/repo/
   ```

4. **Review and commit files**
   ```bash
   git add .
   git commit -m "Initial commit: SecureWallet implementation"
   git push origin main
   ```

## Branch Protection Rules

To ensure code quality and security, set up branch protection rules for the main branch:

1. Go to your repository on GitHub
2. Click on "Settings" > "Branches"
3. Click "Add rule" under "Branch protection rules"
4. Branch name pattern: `main`
5. Apply the following rules:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require signed commits
   - ✅ Include administrators (recommended for strict enforcement)

## GitHub Actions Workflows

The repository already includes two GitHub Actions workflows:

### CI Workflow (`.github/workflows/ci.yml`)

This workflow runs on every push to the main branch and on pull requests:
- Installs dependencies
- Builds the project
- Runs demo tests

### Security Audit Workflow (`.github/workflows/security-audit.yml`)

This workflow runs automatically every week and can be triggered manually:
- Runs npm audit to check for vulnerabilities in dependencies
- Executes custom security checks

## Additional GitHub Settings

### Security Settings

1. Go to "Settings" > "Security" > "Code security and analysis"
2. Enable:
   - Dependabot alerts
   - Dependabot security updates
   - Code scanning (if available in your GitHub plan)

### Secrets

Store sensitive information as GitHub Secrets:

1. Go to "Settings" > "Secrets and variables" > "Actions"
2. Add the following repository secrets:
   - `SESSION_SECRET`: A secure random string for session encryption
   - `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)
   - `INFURA_KEY`: Your Infura API key (for Ethereum RPC access)

## GitHub Pages (Optional)

If you want to host documentation on GitHub Pages:

1. Go to "Settings" > "Pages"
2. Source: Deploy from a branch
3. Branch: `main` (or a dedicated `docs` branch)
4. Folder: `/docs`

## Adding Collaborators

To add team members to the project:

1. Go to "Settings" > "Collaborators and teams"
2. Click "Add people" or "Add teams"
3. Enter GitHub usernames or team names
4. Set appropriate permission levels (Read, Triage, Write, Maintain, Admin)

## Issue Templates

Create issue templates for bug reports and feature requests:

1. Create a directory: `.github/ISSUE_TEMPLATE`
2. Add templates:
   - `bug_report.md`: Template for bug reporting
   - `feature_request.md`: Template for feature requests

## Pull Request Template

Create a pull request template:

1. Create a file: `.github/pull_request_template.md`

## GitHub Automated Audits

To set up AI-powered code reviews using GitHub's integration:

1. Install GitHub App: [ChatGPT Code Review](https://github.com/marketplace/chatgpt-code-review)
2. Configure review settings in your repository
3. Now, when you create a pull request, an AI reviewer will automatically review your code

For more detailed security audits with AI, run the SecureWallet through our AI Audit Guide to get comprehensive feedback on the codebase.