import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = getDefaultConfig({
  appName: 'AskMira AI',
  projectId: projectId,
  chains: [mainnet, base],
  ssr: false, // We're using Vite, not Next.js
});

// Log configuration status
console.log('WalletConnect Configuration:', {
  projectId: projectId === 'demo-project-id' ? 'DEMO (replace with real ID)' : 'Configured',
  chains: ['mainnet', 'base'],
  appName: 'AskMira AI'
});

if (projectId === 'demo-project-id') {
  console.warn('⚠️ Using demo WalletConnect Project ID. Please set VITE_WALLETCONNECT_PROJECT_ID in .env.local');
}