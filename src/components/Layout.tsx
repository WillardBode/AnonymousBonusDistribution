import React from 'react';
import { formatAddress } from '../utils/helpers';
import { CONTRACT_ADDRESS } from '../utils/constants';
import type { ContractState } from '../types';

interface LayoutProps {
  state: ContractState;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ state, children }) => {
  return (
    <div className="container">
      <div className="terminal-box">
        {/* Header Section */}
        <div className="header">
          <div className="logo-section">
            <div className="logo">🔐</div>
            <h1 className="title">Anonymous Bonus Distribution</h1>
            <h2 className="subtitle">Team Incentive Privacy System</h2>
          </div>
          
          {/* Blockchain Status */}
          <div className="blockchain-info">
            <p><strong>LIVE ON SEPOLIA</strong> - Encrypted bonus distribution active!</p>
            <p>Contract: <span className="highlight">{formatAddress(CONTRACT_ADDRESS)}</span></p>
          </div>
        </div>

        {/* User Status Section */}
        {state.userAccount && (
          <div className="user-info">
            <p>&gt; Connected: <span className="highlight">{formatAddress(state.userAccount)}</span></p>
            <p>&gt; Role: <span className="highlight">{state.isManager ? '👑 Manager' : '👤 Employee'}</span></p>
            <p>&gt; Current Distribution: <span className="highlight">#{state.currentDistributionId}</span></p>
          </div>
        )}

        {/* Distribution Info Section */}
        {state.distributionInfo && (
          <div className="distribution-info">
            <h3>&gt; Current Distribution: "{state.distributionInfo.title}"</h3>
            <p>&gt; Total Budget: <span className="highlight">{Number(state.distributionInfo.totalBudget) / 1e18} ETH</span></p>
            <p>&gt; Status: <span className="highlight">
              {state.distributionInfo.isActive ? '🟢 Active' : 
               state.distributionInfo.isFinalized ? '✅ Finalized' : '⏸️ Inactive'}
            </span></p>
            <p>&gt; Recipients: <span className="highlight">{Number(state.distributionInfo.recipientCount)}</span></p>
            <p>&gt; Deadline: <span className="highlight">{new Date(Number(state.distributionInfo.deadline) * 1000).toLocaleDateString()}</span></p>
            
            {state.bonusStatus && (
              <div className="bonus-status">
                <p>&gt; Your Bonus Status: 
                  {state.bonusStatus.hasBonus ? (
                    state.bonusStatus.hasClaimed ? 
                      <span className="highlight"> ✅ Claimed</span> : 
                      <span className="highlight"> 💰 Available to Claim</span>
                  ) : (
                    <span className="highlight"> ⏳ Not Allocated</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Welcome Text */}
        <div className="terminal-text">
          <p>🌟 Welcome to Anonymous Bonus Distribution System</p>
          <p>⚡ Powered by Zama's Fully Homomorphic Encryption (FHE)</p>
          <p>🔒 All bonus amounts are encrypted on-chain</p>
          <p>👁️ Only recipients can see their bonus amounts</p>
          <p>🎯 Managers can allocate bonuses without revealing amounts to others</p>
          <p>🏆 Perfect for confidential team incentive programs</p>
        </div>

        {/* Message Display */}
        <div className={`message-box ${state.message.type}`}>
          <p>&gt; {state.message.text}</p>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {children}
        </div>

        {/* Footer */}
        <div className="footer">
          <p>🔒 Secure • 🕶️ Private • 🌐 Transparent • ⚡ Built with Zama FHE</p>
        </div>
      </div>
    </div>
  );
};