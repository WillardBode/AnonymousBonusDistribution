# Hello FHEVM Tutorial: Building Your First Confidential dApp

Welcome to the most comprehensive beginner-friendly tutorial for building a confidential dApp using Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine). This tutorial will guide you step-by-step through creating your first privacy-preserving application on blockchain.

## 🎯 What You'll Learn

By the end of this tutorial, you will:

1. **Understand FHEVM fundamentals** - Learn how Fully Homomorphic Encryption enables confidential smart contracts
2. **Build encrypted smart contracts** - Create Solidity contracts that handle encrypted data
3. **Develop a privacy-focused frontend** - Build a React application that interacts with encrypted blockchain data
4. **Deploy and test confidential dApps** - Deploy your application to Zama's testnet
5. **Implement real-world privacy patterns** - Apply encryption in practical scenarios

## 🚀 Target Audience

This tutorial is designed for Web3 developers who:

- ✅ Have basic Solidity knowledge (can write simple smart contracts)
- ✅ Are familiar with standard Ethereum tools (Hardhat, MetaMask, React)
- ❌ **No FHE or cryptography knowledge required!**
- ❌ **No advanced mathematics background needed!**

## 📋 Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **MetaMask** browser extension
- **Git** for version control
- **Code editor** (VS Code recommended)

### Required Knowledge
- Basic JavaScript/TypeScript
- React fundamentals
- Solidity basics (functions, contracts, events)
- How to use MetaMask

## 🔧 Project Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/YourUsername/hello-fhevm-tutorial
cd hello-fhevm-tutorial
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- `@fhevm/solidity` - FHEVM Solidity library
- `@fhevm/hardhat-plugin` - Hardhat plugin for FHEVM
- `ethers` - Ethereum JavaScript library
- `react` - Frontend framework

### Step 3: Understanding the Project Structure

```
hello-fhevm-tutorial/
├── contracts/              # Smart contracts
│   └── AnonymousBonusDistribution.sol
├── scripts/                # Deployment scripts
│   └── deploy.ts
├── src/                    # Frontend application
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   └── App.tsx            # Main application
├── test/                  # Smart contract tests
├── hardhat.config.cjs     # Hardhat configuration
└── package.json          # Project dependencies
```

## 🧠 Understanding FHEVM

### What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) allows smart contracts to perform computations on encrypted data without ever decrypting it. This enables true privacy on blockchain.

### Key Concepts

1. **Encrypted Types**: Special data types that hold encrypted values
   - `euint8`, `euint16`, `euint32`, `euint64` - Encrypted integers
   - `ebool` - Encrypted boolean
   - `eaddress` - Encrypted address

2. **FHE Operations**: Functions that work on encrypted data
   - `FHE.add()` - Addition of encrypted values
   - `FHE.le()` - Less than or equal comparison
   - `FHE.select()` - Conditional selection

3. **Access Control**: Managing who can decrypt data
   - `FHE.allow()` - Grant decryption permission
   - `FHE.allowThis()` - Allow contract to use encrypted value

## 📝 Smart Contract Deep Dive

Let's examine our example contract: **Anonymous Bonus Distribution System**

### Core Contract Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";

contract AnonymousBonusDistribution {
    // Encrypted bonus amounts - nobody can see individual amounts!
    struct EmployeeBonus {
        euint64 encryptedAmount;  // 🔐 Encrypted amount
        bool hasBeenSet;
        bool hasClaimed;
        uint256 timestamp;
    }
}
```

### Key FHEVM Features Demonstrated

#### 1. Encrypting Data

```solidity
function allocateBonus(
    uint256 distributionId,
    address recipient,
    uint256 amount
) external onlyAuthorized {
    // Convert plain amount to encrypted amount
    euint64 encryptedAmount = FHE.asEuint64(uint64(amount));

    // Store encrypted amount - nobody can read it!
    bonuses[distributionId][recipient] = EmployeeBonus({
        encryptedAmount: encryptedAmount,
        hasBeenSet: true,
        hasClaimed: false,
        timestamp: block.timestamp
    });
}
```

#### 2. Access Control for Encrypted Data

```solidity
// Grant permissions to decrypt
FHE.allowThis(encryptedAmount);        // Contract can use it
FHE.allow(encryptedAmount, recipient); // Employee can decrypt their amount
FHE.allow(encryptedAmount, msg.sender); // Manager can see what they allocated
```

#### 3. Conditional Logic with Encrypted Values

```solidity
function calculateTaxBracket(euint64 amount) external returns (euint32) {
    euint64 threshold1 = FHE.asEuint64(50000);
    euint64 threshold2 = FHE.asEuint64(100000);

    // Conditional logic on encrypted data!
    return FHE.select(
        FHE.le(amount, threshold1),
        BRACKET_1_RATE,
        FHE.select(
            FHE.le(amount, threshold2),
            BRACKET_2_RATE,
            BRACKET_3_RATE
        )
    );
}
```

## 🎨 Frontend Implementation

### Setting Up Web3 Connection

Our React frontend connects to the blockchain and handles encrypted transactions:

```typescript
// hooks/useWeb3.ts
export const useWeb3 = () => {
  const [userAccount, setUserAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<AnonymousBonusDistribution | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        setUserAccount(accounts[0]);

        // Connect to contract
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          AnonymousBonusDistributionABI,
          signer
        );

        setContract(contractInstance);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };
};
```

### Interacting with Encrypted Data

```typescript
// components/ManagerSection.tsx
const allocateBonus = async () => {
  if (!state.contract) return;

  try {
    setLoading(true);

    // This amount will be encrypted by the smart contract!
    const transaction = await state.contract.allocateBonus(
      distributionId,
      recipientAddress,
      bonusAmount  // Plain amount - becomes encrypted in contract
    );

    await transaction.wait();
    setMessage('✅ Bonus allocated successfully! Amount is now encrypted.');
  } catch (error) {
    setMessage(`❌ Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

## 🚀 Deployment Guide

### Step 1: Configure Hardhat

```javascript
// hardhat.config.cjs
module.exports = {
  solidity: "0.8.24",
  networks: {
    zama: {
      url: "https://devnet.zama.ai/",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8009,
    }
  }
};
```

### Step 2: Set Environment Variables

Create `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
```

### Step 3: Deploy Contract

```bash
npx hardhat run scripts/deploy.ts --network zama
```

### Step 4: Build and Deploy Frontend

```bash
npm run build
# Deploy to Vercel, Netlify, or your preferred hosting
```

## 🧪 Testing Your dApp

### Step 1: Connect MetaMask

1. Open your deployed application
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Ensure you're on Zama testnet

### Step 2: Create Distribution (Manager)

1. Enter distribution details:
   - **Title**: "Q4 Performance Bonuses"
   - **Budget**: 10000 (tokens)
   - **Duration**: 30 (days)

2. Click "Create Distribution"
3. Confirm transaction in MetaMask

### Step 3: Allocate Bonuses (Manager)

1. Select your distribution
2. Add employee addresses and amounts:
   - Employee 1: `0x123...` → 5000 tokens
   - Employee 2: `0x456...` → 3000 tokens
   - Employee 3: `0x789...` → 2000 tokens

3. Click "Allocate Bonus"
4. **Notice**: Amounts are now encrypted on blockchain!

### Step 4: Claim Bonus (Employee)

1. Switch to employee wallet in MetaMask
2. Visit the application
3. View "Employee Section"
4. Click "Check My Bonus" - you can only see YOUR bonus amount!
5. Click "Claim Bonus" when ready

## 🔐 Privacy Features Explained

### What Makes This "Confidential"?

1. **Encrypted Storage**: Bonus amounts are stored as `euint64` (encrypted 64-bit integers)
2. **Private Calculations**: Tax brackets calculated on encrypted data
3. **Selective Disclosure**: Only relevant parties can decrypt their data
4. **Zero Knowledge**: Other employees cannot see individual bonus amounts

### Privacy Guarantees

- ✅ Managers can see what they allocated
- ✅ Employees can see only their own amounts
- ✅ External observers see only encrypted data
- ✅ Total budget is public (for transparency)
- ❌ Individual amounts remain private

## 🎓 Advanced Concepts

### Working with Encrypted Comparisons

```solidity
function validateDeductions(euint64 income, euint64 deductions) internal returns (ebool) {
    // Compare encrypted values without revealing them
    return FHE.le(deductions, income);
}
```

### Conditional Encrypted Operations

```solidity
// Calculate bonus multiplier based on encrypted performance score
function calculateBonus(euint32 performanceScore) external returns (euint64) {
    euint32 threshold = FHE.asEuint32(85);
    euint64 baseBonus = FHE.asEuint64(1000);
    euint64 highPerformerBonus = FHE.asEuint64(2000);

    return FHE.select(
        FHE.gt(performanceScore, threshold),
        highPerformerBonus,
        baseBonus
    );
}
```

## 🛠️ Common Patterns and Best Practices

### 1. Access Control Pattern

```solidity
modifier onlyAuthorized() {
    require(msg.sender == admin || authorizedManagers[msg.sender], "Not authorized");
    _;
}

function sensitiveOperation() external onlyAuthorized {
    // Only authorized users can call this
}
```

### 2. Encryption Pattern

```solidity
function handleSensitiveData(uint256 publicValue) external {
    // Convert to encrypted type
    euint64 encryptedValue = FHE.asEuint64(uint64(publicValue));

    // Set permissions
    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);

    // Store encrypted data
    sensitiveData[msg.sender] = encryptedValue;
}
```

### 3. Frontend Error Handling Pattern

```typescript
const handleEncryptedOperation = async () => {
  try {
    setLoading(true);

    const tx = await contract.encryptedFunction(params);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      setMessage('✅ Operation successful!');
    }
  } catch (error) {
    if (error.code === 'ACTION_REJECTED') {
      setMessage('❌ Transaction cancelled by user');
    } else if (error.data?.message) {
      setMessage(`❌ Contract error: ${error.data.message}`);
    } else {
      setMessage(`❌ Unexpected error: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};
```

## 🐛 Troubleshooting Common Issues

### Issue 1: "Cannot read encrypted value"

**Problem**: Trying to access encrypted data without proper permissions.

**Solution**: Ensure `FHE.allow()` is called for all parties who need access.

```solidity
// ❌ Wrong
euint64 encrypted = FHE.asEuint64(100);
// No permissions set - nobody can use this!

// ✅ Correct
euint64 encrypted = FHE.asEuint64(100);
FHE.allowThis(encrypted);
FHE.allow(encrypted, recipient);
```

### Issue 2: "Transaction reverted"

**Problem**: Gas estimation failed due to encrypted operations.

**Solution**: Increase gas limit manually.

```typescript
const transaction = await contract.encryptedFunction(params, {
  gasLimit: 1000000  // Set higher gas limit
});
```

### Issue 3: "Network mismatch"

**Problem**: MetaMask not connected to correct network.

**Solution**: Add Zama testnet to MetaMask.

```typescript
const addZamaNetwork = async () => {
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: '0x1F49', // 8009 in hex
      chainName: 'Zama Devnet',
      nativeCurrency: { name: 'ZAMA', symbol: 'ZAMA', decimals: 18 },
      rpcUrls: ['https://devnet.zama.ai/'],
      blockExplorerUrls: ['https://main.explorer.zama.ai/']
    }]
  });
};
```

## 🎯 Real-World Applications

### Use Cases for Confidential dApps

1. **Private Voting Systems**
   - Vote counts remain encrypted until reveal
   - Individual votes stay private
   - Prevents vote buying and coercion

2. **Confidential Auctions**
   - Bid amounts encrypted during auction
   - Winner determined without revealing losing bids
   - Prevents bid manipulation

3. **Private Medical Records**
   - Patient data encrypted on blockchain
   - Selective disclosure to authorized doctors
   - Compliance with privacy regulations

4. **Anonymous Salary Systems**
   - Employee salaries remain confidential
   - Transparent budgeting without individual disclosure
   - Fair compensation analysis

## 📚 Next Steps

### Extend This Tutorial

1. **Add More Encryption Types**
   ```solidity
   ebool private eligibilityStatus;
   eaddress private anonymousRecipient;
   ```

2. **Implement Batch Operations**
   ```solidity
   function batchAllocateBonus(address[] memory recipients, uint256[] memory amounts) external {
       for (uint i = 0; i < recipients.length; i++) {
           euint64 encrypted = FHE.asEuint64(uint64(amounts[i]));
           // Process each allocation
       }
   }
   ```

3. **Add Time-based Reveals**
   ```solidity
   function revealAfterDeadline(uint256 distributionId) external {
       require(block.timestamp > distributionRounds[distributionId].deadline, "Too early");
       // Implement reveal logic
   }
   ```

### Learn More

- 📖 [FHEVM Documentation](https://docs.zama.ai/fhevm)
- 💻 [Advanced FHEVM Examples](https://github.com/zama-ai/fhevm)
- 🎥 [FHEVM Video Tutorials](https://www.youtube.com/c/ZamaFHE)
- 💬 [Zama Community Discord](https://discord.gg/zama)

## 🏆 Conclusion

Congratulations! You've successfully:

- ✅ Built your first confidential dApp using FHEVM
- ✅ Implemented encrypted smart contracts with Solidity
- ✅ Created a privacy-preserving frontend with React
- ✅ Deployed and tested on Zama's blockchain
- ✅ Learned fundamental FHE patterns and best practices

### Key Takeaways

1. **FHEVM enables true privacy** on blockchain without sacrificing functionality
2. **Encrypted types** (`euint64`, `ebool`) work like regular types but preserve privacy
3. **Access control** is crucial - always set proper permissions with `FHE.allow()`
4. **Frontend integration** is seamless with standard Web3 tools
5. **Real-world applications** are vast and impactful

### Your Privacy Journey Starts Now

You now have the foundation to build privacy-preserving applications that can revolutionize industries. The possibilities are endless:

- Financial services with confidential transactions
- Healthcare systems with private patient data
- Voting platforms with anonymous ballots
- Supply chain tracking with competitive confidentiality

Welcome to the future of confidential computing on blockchain! 🚀🔐

---

**Repository**: [Hello FHEVM Tutorial](https://github.com/YourUsername/hello-fhevm-tutorial)

**Live Demo**: [Try the Application](https://your-demo-url.vercel.app)

**Need Help?**: Join the [Zama Community](https://discord.gg/zama) for support and discussion.

Built with ❤️ for the privacy-preserving Web3 future.