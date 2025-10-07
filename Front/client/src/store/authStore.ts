import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  // Twitter auth
  isTwitterAuthenticated: boolean;
  twitterUser: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
  } | null;
  
  // Wallet auth
  walletAddress: string | null;
  walletConnected: boolean;
  
  // Modal state
  isAuthModalOpen: boolean;
  
  // Actions
  setTwitterAuth: (user: AuthState['twitterUser']) => void;
  setWalletAuth: (address: string | null, connected: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => void;
  disconnectWallet: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isTwitterAuthenticated: false,
      twitterUser: null,
      walletAddress: null,
      walletConnected: false,
      isAuthModalOpen: false,
      
      // Actions
      setTwitterAuth: (user) => {
        set({ 
          twitterUser: user, 
          isTwitterAuthenticated: !!user 
        });
        console.log('Twitter auth set:', user);
        if (user) {
          set({ isAuthModalOpen: false });
        }
      },
      
      setWalletAuth: (address, connected) => {
        set({ 
          walletAddress: address, 
          walletConnected: connected 
        });
        console.log('Wallet auth set:', { address, connected });
        if (connected && address) {
          set({ isAuthModalOpen: false });
          // Expose wallet address globally
          if (typeof window !== 'undefined') {
            (window as any).__walletAddress = address;
          }
        }
      },
      
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      
      logout: () => {
        console.log('Logging out from Twitter...');
        set({ 
          twitterUser: null, 
          isTwitterAuthenticated: false 
        });
        // Call server logout endpoint
        fetch('/api/auth/logout', { method: 'POST' })
          .catch(err => console.error('Logout error:', err));
      },
      
      disconnectWallet: () => {
        console.log('Disconnecting wallet...');
        // Disconnect from RainbowKit first
        if (typeof window !== 'undefined' && (window as any).wagmi) {
          try {
            (window as any).wagmi.disconnect();
          } catch (err) {
            console.log('Wagmi disconnect not available, manually disconnecting');
          }
        }
        set({ 
          walletAddress: null, 
          walletConnected: false 
        });
        if (typeof window !== 'undefined') {
          delete (window as any).__walletAddress;
        }
      }
    }),
    {
      name: 'askmira-auth-storage',
      partialize: (state) => ({
        twitterUser: state.twitterUser,
        isTwitterAuthenticated: state.isTwitterAuthenticated,
        walletAddress: state.walletAddress,
        walletConnected: state.walletConnected,
      })
    }
  )
);