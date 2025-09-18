# Quick Start Guide: Hello FHEVM

⚡ **5-Minute Setup** | Get your first confidential dApp running fast!

## 🚀 Prerequisites Check

Before starting, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **MetaMask** browser extension
- ✅ **Basic Solidity** knowledge
- ✅ **Git** for cloning repository

## 📥 1. Clone & Install

```bash
# Clone the repository
git clone [your-repository-url]
cd hello-fhevm-tutorial

# Install all dependencies (this may take 2-3 minutes)
npm install
```

## 🔧 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Add your MetaMask private key (testnet only!)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Optional: Add Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

⚠️ **Security Note**: Only use testnet private keys. Never use mainnet private keys in development!

## 🌐 3. Network Configuration

Add Zama Testnet to MetaMask:

1. Open MetaMask
2. Click network dropdown → "Add network"
3. Add custom RPC:

```
Network Name: Zama Devnet
RPC URL: https://devnet.zama.ai/
Chain ID: 8009
Currency: ZAMA
Block Explorer: https://main.explorer.zama.ai/
```

## 💰 4. Get Test Tokens

1. Go to [Zama Faucet](https://faucet.zama.ai/)
2. Enter your MetaMask address
3. Request test ZAMA tokens
4. Wait 1-2 minutes for tokens to arrive

## 🚀 5. Deploy Smart Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to Zama testnet
npx hardhat run scripts/deploy.ts --network zama

# Copy the deployed contract address from output
```

## 🎨 6. Start Frontend

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

## ✅ 7. Test the dApp

### As a Manager:
1. Click "Connect Wallet" and approve MetaMask
2. Create a distribution:
   - Title: "Test Bonus Round"
   - Budget: 1000
   - Duration: 7 days
3. Allocate bonuses to test addresses

### As an Employee:
1. Switch to different MetaMask account
2. Connect wallet
3. Check "Employee Section" for your bonus
4. Claim your bonus!

## 🛠️ Common Issues & Solutions

### Issue: "Cannot resolve dependency"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Network not found"
- Ensure Zama testnet is added to MetaMask
- Check RPC URL is correct
- Try switching networks and back

### Issue: "Insufficient funds"
- Get more test tokens from faucet
- Ensure you're on Zama testnet, not mainnet

### Issue: "Contract not deployed"
```bash
# Check deployment was successful
npx hardhat run scripts/verify-deployment.ts --network zama
```

## 🎯 Next Steps

1. **Explore the Code**: Read through `contracts/AnonymousBonusDistribution.sol`
2. **Follow Full Tutorial**: Open [HELLO_FHEVM_TUTORIAL.md](HELLO_FHEVM_TUTORIAL.md)
3. **Customize Features**: Add your own encrypted logic
4. **Join Community**: Share on [Zama Discord](https://discord.gg/zama)

## 📚 File Structure Overview

```
hello-fhevm-tutorial/
├── contracts/
│   └── AnonymousBonusDistribution.sol  # Main FHEVM contract
├── scripts/
│   └── deploy.ts                       # Deployment script
├── src/
│   ├── components/                     # React components
│   ├── hooks/useWeb3.ts               # Web3 connection logic
│   └── App.tsx                        # Main app
├── HELLO_FHEVM_TUTORIAL.md            # Complete tutorial
└── hardhat.config.cjs                 # Hardhat config
```

## 🆘 Need Help?

- 📖 **Full Tutorial**: [HELLO_FHEVM_TUTORIAL.md](HELLO_FHEVM_TUTORIAL.md)
- 💬 **Discord**: [Join Zama Community](https://discord.gg/zama)
- 📧 **Issues**: Create GitHub issue
- 🔍 **Docs**: [docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)

---

🎉 **Congratulations!** You now have a working confidential dApp. Time to explore the full tutorial and learn how FHEVM magic works!