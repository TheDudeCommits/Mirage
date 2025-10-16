// Utility to reload auth configuration with fresh environment variables
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';

// Function to reload Twitter strategy with fresh environment variables
export function reloadTwitterStrategy() {
  const TWITTER_CONSUMER_KEY = process.env.TWITTER_CLIENT_ID;
  const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CLIENT_SECRET;
  // Use localhost for development since it's now added to Twitter app
  const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://askmira.io' 
    : (process.env.NEXTAUTH_URL || 'http://localhost:3000'); // Development uses localhost (now configured in Twitter app)

  console.log('🔄 Reloading Twitter strategy with fresh env vars:', {
    TWITTER_CLIENT_ID: TWITTER_CONSUMER_KEY ? 'SET' : 'MISSING',
    TWITTER_CLIENT_SECRET: TWITTER_CONSUMER_SECRET ? 'SET' : 'MISSING',
    CALLBACK_URL: `${BASE_URL}/api/auth/callback/twitter`
  });

  if (TWITTER_CONSUMER_KEY && TWITTER_CONSUMER_SECRET) {
    // Remove existing strategy
    passport.unuse('twitter');
    
    // Add new strategy with correct credentials
    passport.use(new TwitterStrategy({
      consumerKey: TWITTER_CONSUMER_KEY,
      consumerSecret: TWITTER_CONSUMER_SECRET,
      callbackURL: `${BASE_URL}/api/auth/callback/twitter`,
      includeEmail: false
    }, (token: string, tokenSecret: string, profile: any, done: Function) => {
      console.log('✅ Twitter auth callback with fresh credentials:', {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName
      });
      
      const user = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        profileImageUrl: profile.photos?.[0]?.value,
        provider: 'twitter'
      };
      
      return done(null, user);
    }));
    
    console.log('✅ Twitter strategy reloaded successfully');
    return true;
  } else {
    console.error('❌ Cannot reload Twitter strategy - missing credentials');
    return false;
  }
}