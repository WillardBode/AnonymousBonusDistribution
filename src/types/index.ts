export interface DistributionInfo {
  title: string;
  totalBudget: bigint;
  isActive: boolean;
  isFinalized: boolean;
  createdAt: bigint;
  deadline: bigint;
  recipientCount: bigint;
}

export interface BonusStatus {
  hasBonus: boolean;
  hasClaimed: boolean;
  timestamp: bigint;
}

export interface DistributionTemplate {
  title: string;
  budget: string;
  duration: string;
}

export interface EmployeePreset {
  amount: string;
  title: string;
}

export interface MessageState {
  text: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface ContractState {
  userAccount: string | null;
  contract: any;
  isManager: boolean;
  currentDistributionId: number;
  isLoading: boolean;
  distributionInfo: DistributionInfo | null;
  bonusStatus: BonusStatus | null;
  message: MessageState;
}

