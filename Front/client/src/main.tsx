import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wallet';
import '@rainbow-me/rainbowkit/styles.css';
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider 
        theme={darkTheme({
          accentColor: '#00d4aa',
          accentColorForeground: 'black',
          borderRadius: 'medium',
          fontStack: 'system',
          overlayBlur: 'small',
        })}
      >
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
