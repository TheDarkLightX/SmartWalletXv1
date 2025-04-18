# SmartWalletXv1

## Setup & Demo

1. Clone your repo:
   ```bash
   git clone https://github.com/TheDarkLightX/SmartWalletXv1.git
   cd SmartWalletXv1
   ```
2. Overwrite these files with the provided versions:
   - `contracts/SmartWallet.sol`
   - `scripts/deploy.ts`
   - `pages/_app.tsx`
   - `pages/index.tsx`
   - `pages/wallet.tsx`
   - `components/Sidebar.tsx`
   - `components/Header.tsx`
   - `config/chains.ts`
   - `tailwind.config.js`
   - `hardhat.config.ts`
   - `package.json`
   - `README.md`
   - `config/abi/SmartWallet.json`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run tests:
   ```bash
   npx hardhat test
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000 to view your updated wallet app.
