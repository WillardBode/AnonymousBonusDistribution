import type { DistributionTemplate, EmployeePreset } from '../types';

// Contract Configuration
export const CONTRACT_ADDRESS = "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677";

export const CONTRACT_ABI = [
  "function createDistribution(string memory title, uint256 totalBudget, uint256 durationInDays) external",
  "function allocateBonus(uint256 distributionId, address recipient, uint256 amount) external",
  "function claimBonus(uint256 distributionId) external",
  "function finalizeDistribution(uint256 distributionId) external",
  "function setManagerAuthorization(address manager, bool authorized) external",
  "function getDistributionInfo(uint256 distributionId) external view returns (string memory, uint256, bool, bool, uint256, uint256, uint256)",
  "function getBonusStatus(uint256 distributionId, address employee) external view returns (bool, bool, uint256)",
  "function hasReceivedBonus(uint256 distributionId, address recipient) external view returns (bool)",
  "function getCurrentDistributionId() external view returns (uint256)",
  "function isAuthorizedManager(address manager) external view returns (bool)",
  "function getDistributionRecipients(uint256 distributionId) external view returns (address[])",
  "function getMyEncryptedBonus(uint256 distributionId) external view returns (uint256)",
  "function calculateTaxBracket(uint256 amount) external view returns (uint256)",
  "function admin() external view returns (address)",
  "event DistributionCreated(uint256 indexed distributionId, string title, uint256 totalBudget, uint256 deadline)",
  "event BonusAllocated(uint256 indexed distributionId, address indexed recipient)",
  "event BonusClaimed(uint256 indexed distributionId, address indexed recipient)",
  "event DistributionFinalized(uint256 indexed distributionId, uint256 totalDistributed)",
  "event ManagerAuthorized(address indexed manager)",
  "event ManagerRevoked(address indexed manager)"
];

// Distribution Templates
export const DISTRIBUTION_TEMPLATES: Record<string, DistributionTemplate> = {
  quarterly: {
    title: "Q4 Performance Bonus",
    budget: "10.0",
    duration: "30"
  },
  annual: {
    title: "Annual Achievement Award",
    budget: "25.0",
    duration: "45"
  },
  project: {
    title: "Project Completion Bonus",
    budget: "5.0",
    duration: "14"
  },
  holiday: {
    title: "Holiday Season Bonus",
    budget: "15.0",
    duration: "21"
  }
};

// Employee Bonus Presets
export const EMPLOYEE_PRESETS: Record<string, EmployeePreset> = {
  senior: { amount: "0.5", title: "Senior Developer" },
  mid: { amount: "0.3", title: "Mid-Level Developer" },
  junior: { amount: "0.2", title: "Junior Developer" },
  manager: { amount: "0.8", title: "Team Lead" }
};

// Sample Employee Addresses (for demo)
export const SAMPLE_EMPLOYEES: Record<string, string> = {
  senior: "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677",
  mid: "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677",
  junior: "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677",
  manager: "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677"
};

// Network Configuration
export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Test Network',
  rpcUrls: ['https://sepolia.infura.io/v3/', 'https://ethereum-sepolia.publicnode.com'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  blockExplorerUrls: ['https://sepolia.etherscan.io/']
};