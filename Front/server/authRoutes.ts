import { Router } from 'express';
import passport, { generateAuthToken } from './auth.js';
import { reloadTwitterStrategy } from './reloadAuth.js';

const router = Router();

// Twitter OAuth routes
router.get('/auth/twitter', (req, res, next) => {
  // Ensure Twitter strategy is reloaded with fresh environment variables
  const reloadSuccess = reloadTwitterStrategy();
  if (!reloadSuccess) {
    return res.status(500).json({ error: 'Twitter authentication not available' });
  }
  
  // Add error handling for Twitter authentication
  passport.authenticate('twitter', (err, user, info) => {
    if (err) {
      console.error('Twitter OAuth error:', err);
      return res.redirect('/?error=twitter_config_error');
    }
    if (!user) {
      console.log('Twitter OAuth failed:', info);
      return res.redirect('/?error=twitter_auth_failed');
    }
    // This shouldn't happen in the redirect flow, but handle it
    return res.redirect('/');
  })(req, res, next);
});

router.get('/auth/callback/twitter',
  passport.authenticate('twitter', { 
    failureRedirect: '/?error=twitter_auth_failed',
    session: false
  }),
  (req, res) => {
    console.log('Twitter auth successful:', req.user);
    
    if (req.user) {
      // Generate JWT token
      const token = generateAuthToken(req.user as any);
      
      // Set secure HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Redirect back to the application with success parameter
      // Use the same base URL for redirect
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://askmira.io/?twitter_auth=success'
        : 'http://localhost:5000/?twitter_auth=success'; // Local development
      res.redirect(redirectUrl);
    } else {
      const errorUrl = process.env.NODE_ENV === 'production' 
        ? 'https://askmira.io/?error=twitter_auth_failed'
        : 'http://localhost:5000/?error=twitter_auth_failed'; // Local development
      res.redirect(errorUrl);
    }
  }
);

// Get current user info
router.get('/auth/user', (req, res) => {
  const token = req.cookies?.auth_token;
  
  if (token) {
    try {
      const { verifyAuthToken } = require('./auth.js');
      const user = verifyAuthToken(token);
      
      if (user) {
        res.json({ user, authenticated: true });
        return;
      }
    } catch (error) {
      console.error('Auth token verification failed:', error);
    }
  }
  
  res.json({ user: null, authenticated: false });
});

// Logout
router.post('/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Health check for auth system
router.get('/auth/status', (req, res) => {
  res.json({
    twitter_configured: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
    jwt_configured: !!(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET),
    callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:5000'}/api/auth/callback/twitter`
  });
});

export default router;