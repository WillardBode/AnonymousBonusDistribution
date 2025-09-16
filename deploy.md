# Deployment Guide

## 🚀 Quick Deploy to Vercel

### Method 1: GitHub Integration (Recommended)
1. Push your code to GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect Vite framework
5. Deploy with default settings

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
npx vercel --prod
```

### Method 3: Manual Build Upload
```bash
# Build the project
npm run build

# Upload dist folder to Vercel dashboard
# Or use Vercel CLI: vercel --prebuilt
```

## 🛠️ Local Development

### Prerequisites
- Node.js >=18.0.0
- MetaMask browser extension
- Sepolia test ETH

### Setup Steps
```bash
# Clone repository
git clone <your-repo-url>
cd anonymous-bonus-distribution

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development URLs
- **Local**: http://localhost:3000
- **Network**: http://localhost:3000 (accessible from other devices)

## 🔧 Configuration

### Environment Variables

Create `.env.local` for local development:
```env
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_NETWORK_NAME=sepolia
VITE_APP_TITLE="Anonymous Bonus Distribution"
```

### Production Configuration

Update production settings in:

**1. Contract Address**
```typescript
// src/utils/constants.ts
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
```

**2. Network Settings**
```typescript
// src/utils/constants.ts
export const SEPOLIA_CHAIN_ID = '0xaa36a7';
```

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] No console errors in browser

### Contract Setup
- [ ] Smart contract deployed to Sepolia
- [ ] Contract address updated in constants.ts
- [ ] Contract verified on Etherscan
- [ ] Manager addresses authorized

### Testing
- [ ] Wallet connection works
- [ ] Manager functions accessible
- [ ] Employee functions work
- [ ] Transactions submit successfully
- [ ] UI responsive on mobile

## 🔒 Security Considerations

### Contract Security
- Verify contract source code on Etherscan
- Use multi-sig wallet for admin functions
- Test all functions on testnet first
- Implement proper access controls

### Frontend Security
- No sensitive data in client code
- Secure API endpoints (if any)
- CSP headers configured via Vercel
- Proper error handling

## 📊 Performance Optimizations

### Build Optimizations
```typescript
// vite.config.ts optimizations already included:
// - Code splitting (vendor, ethers chunks)
// - Minification (terser)
// - Tree shaking
// - Asset optimization
```

### Vercel Optimizations
```json
// vercel.json already configured with:
// - Static asset caching
// - Security headers
// - SPA routing
```

## 🧪 Testing Guide

### Local Testing
1. **Setup MetaMask**:
   - Install MetaMask extension
   - Create or import wallet
   - Switch to Sepolia network
   - Get test ETH from faucet

2. **Test Manager Flow**:
   - Connect wallet with manager privileges
   - Create test distribution
   - Allocate bonuses to test addresses
   - Finalize distribution

3. **Test Employee Flow**:
   - Connect with employee wallet
   - Check bonus status
   - Claim available bonus

### Production Testing
1. **Smoke Tests**:
   - Verify deployment URL loads
   - Check wallet connection
   - Test basic functionality

2. **Integration Tests**:
   - End-to-end manager workflow
   - End-to-end employee workflow
   - Error handling scenarios

## 🆘 Troubleshooting

### Build Failures
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Fix linting issues
npm run lint --fix
```

### Deployment Issues
- **Vercel build fails**: Check build logs for specific errors
- **Functions timeout**: Optimize heavy computations
- **Memory issues**: Reduce bundle size or upgrade plan

### Runtime Issues
- **MetaMask not detected**: Ensure extension is installed and enabled
- **Wrong network**: Guide users to switch to Sepolia
- **Transaction fails**: Check gas, balance, and contract state

## 📈 Monitoring & Analytics

### Vercel Analytics
- Enable Vercel Analytics in dashboard
- Monitor page performance
- Track user interactions

### Error Tracking
Consider adding error tracking:
```bash
npm install @sentry/react @sentry/tracing
```

### Performance Monitoring
- Use Vercel Speed Insights
- Monitor Core Web Vitals
- Track bundle size changes

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📞 Support

### Documentation
- [Project README](./README.md)
- [Zama FHE Docs](https://docs.zama.ai/)
- [Vercel Docs](https://vercel.com/docs)

### Community
- GitHub Issues for bug reports
- Discord for community support
- Stack Overflow for technical questions

## ✅ Go-Live Checklist

- [ ] Contract deployed and verified
- [ ] Manager permissions set
- [ ] Frontend deployed successfully
- [ ] Domain configured (optional)
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Error tracking setup
- [ ] Documentation updated
- [ ] Team trained on usage
- [ ] Backup plan ready