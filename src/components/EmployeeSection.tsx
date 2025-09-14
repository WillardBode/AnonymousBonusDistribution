import React, { useState } from 'react';
import { validateInput } from '../utils/helpers';
import type { ContractState } from '../types';

interface EmployeeSectionProps {
  state: ContractState & { executeTransaction: (method: string, args: any[], description: string) => Promise<any> };
  updateContractInfo: () => Promise<void>;
  setMessage: (text: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  setLoading: (loading: boolean) => void;
}

export const EmployeeSection: React.FC<EmployeeSectionProps> = ({
  state,
  updateContractInfo,
  setMessage,
  setLoading: _setLoading
}) => {
  const [claimDistributionId, setClaimDistributionId] = useState('');

  const claimBonus = async () => {
    if (!state.contract || state.isLoading) return;

    const distributionId = claimDistributionId || state.currentDistributionId.toString();

    if (!validateInput(distributionId, 'number')) {
      setMessage('Please select a distribution!', 'error');
      return;
    }

    const receipt = await state.executeTransaction(
      'claimBonus',
      [parseInt(distributionId)],
      `Claiming your bonus from distribution #${distributionId}`
    );

    if (receipt) {
      await updateContractInfo();
    }
  };

  const canClaim = state.bonusStatus?.hasBonus && !state.bonusStatus?.hasClaimed;
  const hasBonusAllocated = state.bonusStatus?.hasBonus;

  return (
    <div className="employee-section">
      <h3>&gt; Employee Actions</h3>
      
      {canClaim && (
        <div className="form-group">
          <h4>Claim Your Bonus</h4>
          <select 
            className="input-box" 
            value={claimDistributionId}
            onChange={(e) => setClaimDistributionId(e.target.value)}
            disabled={state.isLoading}
          >
            <option value="">Select Distribution</option>
            {state.currentDistributionId > 0 && (
              <option value={state.currentDistributionId}>
                Distribution #{state.currentDistributionId}
              </option>
            )}
          </select>
          <button 
            className="button claim-button" 
            onClick={claimBonus}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Claiming...' : 'Claim My Bonus 💰'}
          </button>
        </div>
      )}
      
      {!hasBonusAllocated && state.userAccount && (
        <div className="no-bonus-message">
          <p>&gt; No bonus allocated to your address in current distribution</p>
          <p>&gt; Please contact your manager if you believe this is an error</p>
        </div>
      )}

      {state.bonusStatus?.hasClaimed && (
        <div className="claimed-message">
          <p>&gt; ✅ You have successfully claimed your bonus!</p>
          <p>&gt; Thank you for your contribution to the team</p>
        </div>
      )}
    </div>
  );
};