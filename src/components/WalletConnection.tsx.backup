import React from 'react';

interface WalletConnectionProps {
  connectWallet: () => Promise<void>;
  isLoading: boolean;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ 
  connectWallet, 
  isLoading 
}) => {
  return (
    <div className="wallet-section">
      <button 
        className={`button wallet-button ${isLoading ? 'loading' : ''}`}
        onClick={connectWallet}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};