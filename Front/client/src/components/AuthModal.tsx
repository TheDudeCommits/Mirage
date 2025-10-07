import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuthStore } from '@/store/authStore';
import { Twitter, Wallet, ChevronDown } from 'lucide-react';
import { SiX } from 'react-icons/si';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    setTwitterAuth, 
    setWalletAuth, 
    twitterUser,
    isTwitterAuthenticated,
    walletAddress,
    walletConnected,
    logout
  } = useAuthStore();

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isCheckingTwitterAuth, setIsCheckingTwitterAuth] = useState(false);
  const lastAuthCheckRef = useRef<number>(0);
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor wallet connection changes
  useEffect(() => {
    if (address && isConnected && !walletConnected) {
      setWalletAuth(address, true);
      console.log('Wallet connected:', address);
    } else if (!isConnected && walletConnected) {
      setWalletAuth(null, false);
      console.log('Wallet disconnected');
    }
  }, [address, isConnected, walletConnected, setWalletAuth]);

  // Check for Twitter auth on component mount and URL changes (optimized)
  useEffect(() => {
    const MIN_CHECK_INTERVAL = 5000; // Minimum 5 seconds between auth checks
    
    const checkTwitterAuth = async (forceCheck = false) => {
      const now = Date.now();
      const timeSinceLastCheck = now - lastAuthCheckRef.current;
      
      // Prevent excessive API calls - only check if:
      // 1. Force check is requested (OAuth callback)
      // 2. Not already checking
      // 3. Not already authenticated
      // 4. Enough time has passed since last check
      if (!forceCheck && (
        isCheckingTwitterAuth || 
        isTwitterAuthenticated || 
        timeSinceLastCheck < MIN_CHECK_INTERVAL
      )) {
        return;
      }
      
      // Clear any pending timeout
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
        authCheckTimeoutRef.current = null;
      }
      
      lastAuthCheckRef.current = now;
      setIsCheckingTwitterAuth(true);
      
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setTwitterAuth(data.user);
        }
      } catch (error) {
        console.error('Failed to check Twitter auth:', error);
      } finally {
        setIsCheckingTwitterAuth(false);
      }
    };

    // Debounced auth check function
    const debouncedAuthCheck = (forceCheck = false, delay = 100) => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
      
      authCheckTimeoutRef.current = setTimeout(() => {
        checkTwitterAuth(forceCheck);
      }, delay);
    };

    // Check when URL changes (for OAuth callback)
    const handleURLChange = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('twitter_auth') === 'success') {
        // Clear URL parameter and force check auth
        window.history.replaceState({}, document.title, window.location.pathname);
        debouncedAuthCheck(true, 100);
      } else if (params.get('error') === 'twitter_config_error') {
        console.error('Twitter app configuration error - check API keys and app settings');
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsCheckingTwitterAuth(false);
      } else if (params.get('error') === 'twitter_auth_failed') {
        console.error('Twitter authentication failed');
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsCheckingTwitterAuth(false);
      }
    };

    // Only check on mount if not already authenticated and enough time has passed
    if (!isTwitterAuthenticated) {
      debouncedAuthCheck(false, 500);
    }

    window.addEventListener('popstate', handleURLChange);
    handleURLChange(); // Check current URL

    return () => {
      window.removeEventListener('popstate', handleURLChange);
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, [setTwitterAuth, isTwitterAuthenticated]);

  const handleTwitterLogin = async () => {
    console.log('Initiating Twitter OAuth...');
    setIsCheckingTwitterAuth(true);
    
    try {
      // Test if the endpoint is available first
      const response = await fetch('/api/auth/twitter', { method: 'HEAD' });
      if (!response.ok) {
        console.error('Twitter auth endpoint not available');
        setIsCheckingTwitterAuth(false);
        return;
      }
      
      // Redirect to Twitter OAuth
      window.location.href = '/api/auth/twitter';
    } catch (error) {
      console.error('Failed to initiate Twitter OAuth:', error);
      setIsCheckingTwitterAuth(false);
    }
  };

  const handleLogout = async () => {
    logout();
    closeAuthModal();
  };

  const handleDisconnectWallet = () => {
    disconnect();
    setWalletAuth(null, false);
    closeAuthModal();
  };

  const isAuthenticated = isTwitterAuthenticated || walletConnected;
  const displayName = twitterUser?.displayName || twitterUser?.username;
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
      <DialogContent className="sm:max-w-sm border-0" style={{
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(20px)',
        border: 'none',
        boxShadow: '0 8px 32px rgba(0, 212, 170, 0.1)',
      }}>
        <DialogHeader>
          <DialogTitle className="text-center font-mono text-lg" style={{ color: 'var(--askmira-primary)' }}>
            {isAuthenticated ? 'NEURAL AUTHENTICATION' : 'NEURAL AUTHENTICATION'}
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="space-y-6 py-4">
            <p className="text-center text-sm opacity-75" style={{ color: 'var(--foreground)' }}>
              Connect your preferred authentication method to access AskMira's advanced features
            </p>

            {/* Twitter Auth Button */}
            <Button
              onClick={handleTwitterLogin}
              disabled={isCheckingTwitterAuth}
              className="w-full h-14 bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-black text-white font-mono transition-all duration-300"
              style={{
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
              data-testid="button-twitter-auth"
            >
              <SiX className="mr-3 h-5 w-5" />
              {isCheckingTwitterAuth ? 'CONNECTING...' : 'CONTINUE WITH X'}
            </Button>

            <div className="flex items-center space-x-4">
              <Separator className="flex-1" style={{ backgroundColor: 'var(--askmira-primary)', opacity: 0.3 }} />
              <span className="text-xs font-mono opacity-50" style={{ color: 'var(--foreground)' }}>OR</span>
              <Separator className="flex-1" style={{ backgroundColor: 'var(--askmira-primary)', opacity: 0.3 }} />
            </div>

            {/* Wallet Connect - Custom styling for RainbowKit */}
            <div className="w-full">
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => {
                  return (
                    <Button
                      onClick={openConnectModal}
                      disabled={!mounted}
                      className="w-full h-14 bg-gradient-to-r from-[var(--askmira-primary)] to-[rgba(0,212,170,0.8)] text-white font-mono hover:from-[rgba(0,212,170,0.9)] hover:to-[var(--askmira-primary)] transition-all duration-300"
                      style={{
                        boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                      data-testid="button-wallet-connect"
                    >
                      <Wallet className="mr-3 h-5 w-5" />
                      CONNECT WALLET
                    </Button>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-sm opacity-75" style={{ color: 'var(--foreground)' }}>
                Authentication successful
              </p>
              
              {twitterUser && (
                <div className="flex items-center justify-center space-x-3 p-3 rounded-lg" style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.3)'
                }}>
                  <SiX className="h-5 w-5" style={{ color: '#000000' }} />
                  <span className="font-mono" style={{ color: 'var(--foreground)' }}>
                    {displayName}
                  </span>
                </div>
              )}
              
              {walletConnected && walletAddress && (
                <div className="flex items-center justify-center space-x-3 p-3 rounded-lg" style={{
                  backgroundColor: 'rgba(0, 212, 170, 0.1)',
                  border: '1px solid rgba(0, 212, 170, 0.3)'
                }}>
                  <Wallet className="h-5 w-5" style={{ color: 'var(--askmira-primary)' }} />
                  <span className="font-mono" style={{ color: 'var(--foreground)' }}>
                    {shortAddress}
                  </span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              {isTwitterAuthenticated && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1 font-mono border-red-500/50 text-red-400 hover:bg-red-500/10"
                  data-testid="button-twitter-logout"
                >
                  Sign Out
                </Button>
              )}
              
              {walletConnected && (
                <Button
                  onClick={handleDisconnectWallet}
                  variant="outline"
                  className="flex-1 font-mono border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                  data-testid="button-wallet-disconnect"
                >
                  Disconnect Wallet
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}