import { ethers } from 'ethers';

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
}

export function formatEther(amount: bigint): string {
  return parseFloat(ethers.formatEther(amount)).toFixed(4);
}

export function parseEtherSafe(value: string): bigint {
  try {
    return ethers.parseEther(value);
  } catch {
    return BigInt(0);
  }
}

export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

export function validateInput(value: string, type: 'number' | 'address' | 'string'): boolean {
  switch (type) {
    case 'number':
      return !isNaN(Number(value)) && Number(value) > 0;
    case 'address':
      return isValidAddress(value);
    case 'string':
      return value.trim().length > 0;
    default:
      return false;
  }
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}