import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// Types
interface TwitterProfile {
  id: string;
  username: string;
  displayName: string;
  photos?: Array<{ value: string }>;
}

interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  provider: 'twitter';
}

// Function to get environment variables (called after dotenv loads)
function getEnvVars() {
  return {
    TWITTER_CONSUMER_KEY: process.env.TWITTER_CLIENT_ID,
    TWITTER_CONSUMER_SECRET: process.env.TWITTER_CLIENT_SECRET,
    JWT_SECRET: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'default-dev-secret',
    BASE_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
  };
}

// Initialize auth configuration
function initializeAuth() {
  const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, JWT_SECRET, BASE_URL } = getEnvVars();
  
  // Debug environment loading
  console.log('🔍 Debug env vars:', {
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ? 'SET' : 'MISSING',
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    envKeys: Object.keys(process.env).filter(k => k.includes('TWITTER'))
  });
  
  // Log configuration status
  console.log('🔐 Authentication Configuration:');
  console.log('  Twitter OAuth:', TWITTER_CONSUMER_KEY ? '✅ Configured' : '❌ Missing TWITTER_CLIENT_ID');
  console.log('  JWT Secret:', JWT_SECRET !== 'default-dev-secret' ? '✅ Configured' : '⚠️ Using default (set NEXTAUTH_SECRET)');
  console.log('  Base URL:', BASE_URL);
  console.log('  Callback URL: ' + BASE_URL + '/api/auth/callback/twitter');

  if (!TWITTER_CONSUMER_KEY || !TWITTER_CONSUMER_SECRET) {
    console.error('❌ Missing Twitter OAuth credentials. Please set:');
    console.error('   TWITTER_CLIENT_ID=your_client_id');
    console.error('   TWITTER_CLIENT_SECRET=your_client_secret');
    console.error('   Get them from: https://developer.twitter.com/en/portal/dashboard');
  }
  
  return { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, JWT_SECRET, BASE_URL };
}

// Lazy initialization - only initialize when accessed
let envVars: ReturnType<typeof initializeAuth> | null = null;
function getInitializedEnvVars() {
  if (!envVars) {
    envVars = initializeAuth();
  }
  return envVars;
}

// Configure Twitter Strategy (OAuth 1.0a - more stable than OAuth 2.0)
// Use a function to get fresh env vars at runtime
function configureTwitterStrategy() {
  const freshEnvVars = getEnvVars();
  // Use localhost for development since it's now added to Twitter app
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://askmira.io' 
    : (process.env.NEXTAUTH_URL || 'http://localhost:3000'); // Development uses localhost (now configured in Twitter app)
    
  return new TwitterStrategy({
    consumerKey: freshEnvVars.TWITTER_CONSUMER_KEY || 'demo-key',
    consumerSecret: freshEnvVars.TWITTER_CONSUMER_SECRET || 'demo-secret',
    callbackURL: `${baseUrl}/api/auth/callback/twitter`,
    includeEmail: false // Twitter API v1.1 email requires special approval
  }, (token: string, tokenSecret: string, profile: TwitterProfile, done: Function) => {
    console.log('Twitter auth callback received:', {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName
    });
    
    const user: AuthenticatedUser = {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      profileImageUrl: profile.photos?.[0]?.value,
      provider: 'twitter'
    };
    
    return done(null, user);
  });
}

// Don't initialize Twitter strategy immediately - wait for dotenv to load
// The strategy will be initialized by reloadAuth.ts after environment variables are loaded
// This prevents the "MISSING credentials" error

// Serialize user for session
passport.serializeUser((user: any, done: Function) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: Function) => {
  done(null, user);
});

// Middleware to check authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Generate JWT token
export const generateAuthToken = (user: AuthenticatedUser): string => {
  return jwt.sign(user, getInitializedEnvVars().JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyAuthToken = (token: string): AuthenticatedUser | null => {
  try {
    return jwt.verify(token, getInitializedEnvVars().JWT_SECRET) as AuthenticatedUser;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export default passport;