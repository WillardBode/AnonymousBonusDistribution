import React, { useState } from 'react';
import { ethers } from 'ethers';
import { DISTRIBUTION_TEMPLATES, EMPLOYEE_PRESETS, SAMPLE_EMPLOYEES } from '../utils/constants';
import { validateInput } from '../utils/helpers';
import type { ContractState } from '../types';

interface ManagerSectionProps {
  state: ContractState & { executeTransaction: (method: string, args: any[], description: string) => Promise<any> };
  updateContractInfo: () => Promise<void>;
  setMessage: (text: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  setLoading: (loading: boolean) => void;
}

export const ManagerSection: React.FC<ManagerSectionProps> = ({
  state,
  updateContractInfo,
  setMessage,
  setLoading: _setLoading
}) => {
  const [formData, setFormData] = useState({
    distributionTitle: '',
    totalBudget: '',
    duration: '',
    selectedDistributionId: '',
    recipientAddress: '',
    bonusAmount: '',
    finalizeDistributionId: ''
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const useTemplate = (templateKey: string) => {
    const template = DISTRIBUTION_TEMPLATES[templateKey];
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      distributionTitle: template.title,
      totalBudget: template.budget,
      duration: template.duration
    }));
    
    setMessage(`Template "${template.title}" applied`, 'success');
  };

  const useEmployeePreset = (presetKey: string) => {
    const preset = EMPLOYEE_PRESETS[presetKey];
    const sampleAddress = SAMPLE_EMPLOYEES[presetKey];
    
    if (!preset) return;

    setFormData(prev => ({
      ...prev,
      bonusAmount: preset.amount,
      recipientAddress: sampleAddress || prev.recipientAddress
    }));
    
    setMessage(`Preset for ${preset.title} applied (${preset.amount} ETH)`, 'success');
  };

  const createDistribution = async () => {
    if (!state.contract || state.isLoading) return;

    const { distributionTitle, totalBudget, duration } = formData;

    if (!validateInput(distributionTitle, 'string') || 
        !validateInput(totalBudget, 'number') || 
        !validateInput(duration, 'number')) {
      setMessage('Please fill all fields with valid values!', 'error');
      return;
    }

    const receipt = await state.executeTransaction(
      'createDistribution',
      [distributionTitle, ethers.parseEther(totalBudget), parseInt(duration)],
      `Creating distribution "${distributionTitle}"`
    );

    if (receipt) {
      // Clear form
      setFormData(prev => ({
        ...prev,
        distributionTitle: '',
        totalBudget: '',
        duration: ''
      }));
      await updateContractInfo();
    }
  };

  const allocateBonus = async () => {
    if (!state.contract || state.isLoading) return;

    const { selectedDistributionId, recipientAddress, bonusAmount } = formData;

    if (!validateInput(selectedDistributionId, 'number') || 
        !validateInput(recipientAddress, 'address') || 
        !validateInput(bonusAmount, 'number')) {
      setMessage('Please fill all fields with valid values!', 'error');
      return;
    }

    // Convert bonus amount to bytes for FHEVM encryption
    const amountInWei = ethers.parseEther(bonusAmount);
    const encryptedAmountBytes = ethers.toBeHex(amountInWei, 32); // 32 bytes for uint256
    const proofBytes = "0x"; // Empty proof for testing
    
    const receipt = await state.executeTransaction(
      'allocateBonus',
      [parseInt(selectedDistributionId), recipientAddress, encryptedAmountBytes, proofBytes],
      `Allocating encrypted bonus of ${bonusAmount} ETH to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`
    );

    if (receipt) {
      // Clear form
      setFormData(prev => ({
        ...prev,
        recipientAddress: '',
        bonusAmount: ''
      }));
      await updateContractInfo();
    }
  };

  const finalizeDistribution = async () => {
    if (!state.contract || state.isLoading) return;

    const { finalizeDistributionId } = formData;

    if (!validateInput(finalizeDistributionId, 'number')) {
      setMessage('Please select a distribution!', 'error');
      return;
    }

    const receipt = await state.executeTransaction(
      'finalizeDistribution',
      [parseInt(finalizeDistributionId)],
      `Finalizing distribution #${finalizeDistributionId}`
    );

    if (receipt) {
      await updateContractInfo();
    }
  };

  if (!state.isManager) return null;

  return (
    <div className="manager-section">
      <h3>&gt; Manager Actions</h3>
      
      {/* Quick Distribution Templates */}
      <div className="quick-templates">
        <h4>Quick Templates</h4>
        <div className="template-buttons">
          {Object.entries(DISTRIBUTION_TEMPLATES).map(([key, template]) => (
            <button 
              key={key}
              className="button template-btn" 
              onClick={() => useTemplate(key)}
              disabled={state.isLoading}
            >
              {template.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* Create Distribution */}
      <div className="form-group">
        <h4>Create New Distribution</h4>
        <input
          className="input-box"
          type="text"
          placeholder="Distribution title"
          value={formData.distributionTitle}
          onChange={(e) => updateField('distributionTitle', e.target.value)}
          disabled={state.isLoading}
        />
        <input
          className="input-box"
          type="number"
          placeholder="Total budget (ETH)"
          step="0.01"
          value={formData.totalBudget}
          onChange={(e) => updateField('totalBudget', e.target.value)}
          disabled={state.isLoading}
        />
        <input
          className="input-box"
          type="number"
          placeholder="Duration (days)"
          min="1"
          max="365"
          value={formData.duration}
          onChange={(e) => updateField('duration', e.target.value)}
          disabled={state.isLoading}
        />
        <button 
          className="button create-button" 
          onClick={createDistribution}
          disabled={state.isLoading || !formData.distributionTitle || !formData.totalBudget || !formData.duration}
        >
          {state.isLoading ? 'Creating...' : 'Create Distribution'}
        </button>
      </div>

      {/* Allocate Bonus */}
      <div className="form-group">
        <h4>Allocate Encrypted Bonus</h4>
        <select 
          className="input-box" 
          value={formData.selectedDistributionId}
          onChange={(e) => updateField('selectedDistributionId', e.target.value)}
          disabled={state.isLoading}
        >
          <option value="">Select Distribution</option>
          {state.currentDistributionId > 0 && (
            <option value={state.currentDistributionId}>
              Distribution #{state.currentDistributionId}
            </option>
          )}
        </select>
        
        {/* Employee Presets */}
        <div className="employee-presets">
          <h5>Employee Presets</h5>
          <div className="preset-buttons">
            {Object.entries(EMPLOYEE_PRESETS).map(([key, preset]) => (
              <button 
                key={key}
                className="button preset-btn" 
                onClick={() => useEmployeePreset(key)}
                disabled={state.isLoading}
              >
                {preset.title} ({preset.amount} ETH)
              </button>
            ))}
          </div>
        </div>
        
        <input
          className="input-box"
          type="text"
          placeholder="Employee wallet address"
          value={formData.recipientAddress}
          onChange={(e) => updateField('recipientAddress', e.target.value)}
          disabled={state.isLoading}
        />
        <input
          className="input-box"
          type="number"
          placeholder="Bonus amount (ETH)"
          step="0.01"
          value={formData.bonusAmount}
          onChange={(e) => updateField('bonusAmount', e.target.value)}
          disabled={state.isLoading}
        />
        <button 
          className="button allocate-button" 
          onClick={allocateBonus}
          disabled={state.isLoading || !formData.selectedDistributionId || !formData.recipientAddress || !formData.bonusAmount}
        >
          {state.isLoading ? 'Allocating...' : 'Allocate Encrypted Bonus'}
        </button>
      </div>

      {/* Finalize Distribution */}
      <div className="form-group">
        <h4>Finalize Distribution</h4>
        <select 
          className="input-box" 
          value={formData.finalizeDistributionId}
          onChange={(e) => updateField('finalizeDistributionId', e.target.value)}
          disabled={state.isLoading}
        >
          <option value="">Select Distribution to Finalize</option>
          {state.currentDistributionId > 0 && (
            <option value={state.currentDistributionId}>
              Distribution #{state.currentDistributionId}
            </option>
          )}
        </select>
        <button 
          className="button finalize-button" 
          onClick={finalizeDistribution}
          disabled={state.isLoading || !formData.finalizeDistributionId}
        >
          {state.isLoading ? 'Finalizing...' : 'Finalize Distribution'}
        </button>
      </div>
    </div>
  );
};