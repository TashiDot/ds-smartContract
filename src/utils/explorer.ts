export function getExplorerBase(chainId: number, rpcUrl: string | undefined): string | null {
  switch (chainId) {
    case 1:
      return 'https://etherscan.io';
    case 5:
      return 'https://goerli.etherscan.io';
    case 11155111:
      return 'https://sepolia.etherscan.io';
    case 137:
      return 'https://polygonscan.com';
    case 80001:
      return 'https://mumbai.polygonscan.com';
    case 8453:
      return 'https://basescan.org';
    case 10:
      return 'https://optimistic.etherscan.io';
    case 42161:
      return 'https://arbiscan.io';
    default:
      if (!rpcUrl) return null;
      try {
        const u = new URL(rpcUrl);
        if (u.hostname.includes('polygon')) return 'https://polygonscan.com';
        if (u.hostname.includes('eth')) return 'https://etherscan.io';
      } catch {}
      return null;
  }
}

export function txExplorerUrl(txHash: string, chainId: number, rpcUrl?: string) {
  const base = getExplorerBase(chainId, rpcUrl);
  return base ? `${base}/tx/${txHash}` : `tx:${txHash}`;
}
