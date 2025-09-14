import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID, SEPOLIA_NETWORK } from '../utils/constants';
import type { ContractState, MessageState } from '../types';

declare global {
  interface Window {
    ethereum: any;
  }
}

export const useWeb3 = () => {
  const [state, setState] = useState<ContractState>({
    userAccount: null,
    contract: null,
    isManager: false,
    currentDistributionId: 0,
    isLoading: false,
    distributionInfo: null,
    bonusStatus: null,
    message: { text: 'Connect MetaMask to access Anonymous Bonus Distribution!', type: 'info' }
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const setMessage = useCallback((text: string, type: MessageState['type'] = 'info') => {
    setState(prev => ({ ...prev, message: { text, type } }));
    
    if (type === 'success') {
      setTimeout(() => {
        setState(prev => ({ ...prev, message: { text: 'Ready for next action', type: 'info' } }));
      }, 5000);
    }
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Check if MetaMask is installed
  const checkMetaMaskInstalled = useCallback(() => {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      setMessage('MetaMask is required! Please install MetaMask browser extension.', 'error');
      return false;
    }
    return true;
  }, [setMessage]);

  // Check and switch to Sepolia network
  const ensureSepoliaNetwork = useCallback(async () => {
    try {
      const currentChainId = await window.ethereum!.request({ method: 'eth_chainId' });
      
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        setMessage('Switching to Sepolia testnet...', 'info');
        
        try {
          await window.ethereum!.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // Network not added to MetaMask
          if (switchError.code === 4902) {
            setMessage('Adding Sepolia network to MetaMask...', 'info');
            await window.ethereum!.request({
              method: 'wallet_addEthereumChain',
              params: [SEPOLIA_NETWORK]
            });
          } else {
            throw switchError;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      setMessage('Failed to switch to Sepolia network. Please switch manually in MetaMask.', 'error');
      return false;
    }
  }, [setMessage]);

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    try {
      if (!checkMetaMaskInstalled()) return;

      setLoading(true);
      setMessage('Connecting to MetaMask...');

      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        setMessage('No accounts found. Please create an account in MetaMask.', 'error');
        return;
      }

      // Ensure we're on Sepolia network
      const networkSwitched = await ensureSepoliaNetwork();
      if (!networkSwitched) return;

      // Create provider and signer
      const newProvider = new ethers.BrowserProvider(window.ethereum!);
      const newSigner = await newProvider.getSigner();
      
      // Verify account
      const address = await newSigner.getAddress();
      console.log('Connected account:', address);

      // Check balance
      const balance = await newProvider.getBalance(address);
      console.log('Account balance:', ethers.formatEther(balance), 'ETH');

      if (balance === 0n) {
        setMessage('Your account has no Sepolia ETH. Please get test ETH from a faucet.', 'warning');
      }

      // Create contract instance
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newSigner);

      // Test contract connection
      try {
        await contractInstance.admin();
        console.log('Contract connection verified');
      } catch (error) {
        console.error('Contract connection failed:', error);
        setMessage('Contract not found. Please check if it\'s deployed on Sepolia.', 'error');
        return;
      }

      setProvider(newProvider);
      setSigner(newSigner);
      
      setState(prev => ({
        ...prev,
        userAccount: address,
        contract: contractInstance
      }));

      setMessage('Successfully connected to MetaMask and Sepolia! 🔐', 'success');
      
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      if (error.code === 4001) {
        setMessage('Connection rejected by user. Please try again.', 'warning');
      } else if (error.code === -32002) {
        setMessage('MetaMask is already processing a request. Please check MetaMask.', 'warning');
      } else {
        setMessage('Failed to connect to MetaMask. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [checkMetaMaskInstalled, ensureSepoliaNetwork, setMessage, setLoading]);

  // Execute contract transaction with proper error handling
  const executeTransaction = useCallback(async (
    contractMethod: string,
    args: any[],
    description: string
  ) => {
    if (!state.contract || !signer) {
      setMessage('Please connect your wallet first', 'error');
      return null;
    }

    try {
      setLoading(true);
      setMessage(`Preparing ${description}...`);

      // Estimate gas
      const gasEstimate = await state.contract[contractMethod].estimateGas(...args);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      setMessage(`Please confirm the transaction in MetaMask for: ${description}`);

      // Execute transaction
      const tx = await state.contract[contractMethod](...args, { gasLimit });
      
      setMessage(`Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`);
      console.log('Transaction hash:', tx.hash);

      // Wait for confirmation
      setMessage('Waiting for transaction confirmation...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setMessage(`${description} completed successfully! 🎉`, 'success');
        console.log('Transaction confirmed:', receipt);
        return receipt;
      } else {
        setMessage(`${description} failed. Please try again.`, 'error');
        return null;
      }

    } catch (error: any) {
      console.error('Transaction failed:', error);

      if (error.code === 4001) {
        setMessage('Transaction rejected by user', 'warning');
      } else if (error.code === -32603) {
        setMessage('Transaction failed. Please check your balance and try again.', 'error');
      } else if (error.message?.includes('insufficient funds')) {
        setMessage('Insufficient Sepolia ETH for gas fees. Please get test ETH from a faucet.', 'error');
      } else if (error.message?.includes('user rejected')) {
        setMessage('Transaction cancelled by user', 'warning');
      } else {
        setMessage(`Transaction failed: ${error.message || 'Unknown error'}`, 'error');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.contract, signer, setMessage, setLoading]);

  // Update contract information
  const updateContractInfo = useCallback(async () => {
    if (!state.contract || !state.userAccount) return;

    try {
      console.log('Updating contract info...');

      // Get current distribution ID
      const currentId = Number(await state.contract.getCurrentDistributionId());
      
      // Check if user is manager
      const isManager = await state.contract.isAuthorizedManager(state.userAccount);

      console.log('Current distribution ID:', currentId);
      console.log('Is manager:', isManager);

      setState(prev => ({
        ...prev,
        currentDistributionId: currentId,
        isManager
      }));

      // Get current distribution info if exists
      if (currentId > 0) {
        const distInfo = await state.contract.getDistributionInfo(currentId);
        const distributionInfo = {
          title: distInfo[0],
          totalBudget: distInfo[1],
          isActive: distInfo[2],
          isFinalized: distInfo[3],
          createdAt: distInfo[4],
          deadline: distInfo[5],
          recipientCount: distInfo[6]
        };

        console.log('Distribution info:', distributionInfo);

        // Get user's bonus status
        const bonusInfo = await state.contract.getBonusStatus(currentId, state.userAccount);
        const bonusStatus = {
          hasBonus: bonusInfo[0],
          hasClaimed: bonusInfo[1],
          timestamp: bonusInfo[2]
        };

        console.log('Bonus status:', bonusStatus);

        setState(prev => ({
          ...prev,
          distributionInfo,
          bonusStatus
        }));
      }

    } catch (error) {
      console.error('Failed to update contract info:', error);
      setMessage('Failed to load contract information', 'error');
    }
  }, [state.contract, state.userAccount, setMessage]);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    
    if (accounts.length === 0) {
      // User disconnected
      setState(prev => ({
        ...prev,
        userAccount: null,
        contract: null,
        isManager: false,
        distributionInfo: null,
        bonusStatus: null
      }));
      setProvider(null);
      setSigner(null);
      setMessage('Wallet disconnected', 'warning');
    } else if (accounts[0] !== state.userAccount) {
      // Account changed - reconnect
      window.location.reload();
    }
  }, [state.userAccount, setMessage]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    console.log('Chain changed to:', chainId);
    
    if (chainId !== SEPOLIA_CHAIN_ID) {
      setMessage('Please switch back to Sepolia testnet', 'warning');
      setState(prev => ({
        ...prev,
        contract: null,
        distributionInfo: null,
        bonusStatus: null
      }));
    } else {
      // Reconnected to Sepolia
      window.location.reload();
    }
  }, [setMessage]);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Update contract info when connected
  useEffect(() => {
    if (state.contract && state.userAccount) {
      updateContractInfo();
    }
  }, [state.contract, state.userAccount, updateContractInfo]);

  // Check if already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          console.log('Already connected account found:', accounts[0]);
          // Auto-connect if already authorized
          connectWallet();
        }
      } catch (error) {
        console.error('Failed to check existing connection:', error);
      }
    };

    checkConnection();
  }, [connectWallet]);

  return {
    ...state,
    provider,
    signer,
    connectWallet,
    executeTransaction,
    updateContractInfo,
    setMessage,
    setLoading,
    isMetaMaskInstalled: checkMetaMaskInstalled()
  };
};