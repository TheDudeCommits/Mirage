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
    JWT_SECRET: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    BASE_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
  };
}

// Initialize auth configuration
function initializeAuth() {
  const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, JWT_SECRET, BASE_URL } = getEnvVars();

  if (!TWITTER_CONSUMER_KEY || !TWITTER_CONSUMER_SECRET) {
    throw new Error("TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET must be set");
  }
  if (!JWT_SECRET) {
    throw new Error("NEXTAUTH_SECRET or JWT_SECRET must be set");
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
  const freshEnvVars = getInitializedEnvVars();
  // Use localhost for development since it's now added to Twitter app
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://askmira.io' 
    : (process.env.NEXTAUTH_URL || 'http://localhost:3000'); // Development uses localhost (now configured in Twitter app)
    
  return new TwitterStrategy({
    consumerKey: freshEnvVars.TWITTER_CONSUMER_KEY,
    consumerSecret: freshEnvVars.TWITTER_CONSUMER_SECRET,
    callbackURL: `${baseUrl}/api/auth/callback/twitter`,
    includeEmail: false // Twitter API v1.1 email requires special approval
  }, (_token: string, _tokenSecret: string, profile: TwitterProfile, done: Function) => {
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
  return jwt.sign(user, getInitializedEnvVars().JWT_SECRET, {
    algorithm: 'HS256',
    audience: 'askmira-web',
    issuer: 'askmira',
    expiresIn: '7d',
  });
};

// Verify JWT token
export const verifyAuthToken = (token: string): AuthenticatedUser | null => {
  try {
    const decoded = jwt.verify(token, getInitializedEnvVars().JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'askmira-web',
      issuer: 'askmira',
    });
    if (
      typeof decoded !== 'object' ||
      decoded.provider !== 'twitter' ||
      typeof decoded.id !== 'string' ||
      typeof decoded.username !== 'string' ||
      typeof decoded.displayName !== 'string' ||
      decoded.id.length > 128 ||
      decoded.username.length > 128 ||
      decoded.displayName.length > 256
    ) {
      return null;
    }
    return {
      id: decoded.id,
      username: decoded.username,
      displayName: decoded.displayName,
      profileImageUrl: typeof decoded.profileImageUrl === 'string'
        ? decoded.profileImageUrl
        : undefined,
      provider: 'twitter',
    };
  } catch {
    return null;
  }
};

export default passport;
