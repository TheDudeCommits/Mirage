import { Router } from 'express';
import passport, {
  generateAuthToken,
  verifyAuthToken,
} from './auth.js';
import { reloadTwitterStrategy } from './reloadAuth.js';
import {
  authReadRateLimit,
  authWriteRateLimit,
  oauthCallbackRateLimit,
  oauthStartRateLimit,
} from './security/rate-limit.js';

const router = Router();

// Twitter OAuth routes
router.get('/auth/twitter', oauthStartRateLimit, (req, res, next) => {
  // Ensure Twitter strategy is reloaded with fresh environment variables
  const reloadSuccess = reloadTwitterStrategy();
  if (!reloadSuccess) {
    return res.status(500).json({ error: 'Twitter authentication not available' });
  }
  
  // Add error handling for Twitter authentication
  passport.authenticate('twitter', (err: unknown, user: Express.User | false | null) => {
    if (err) {
      console.error('Twitter OAuth failed during initialization');
      return res.redirect('/?error=twitter_config_error');
    }
    if (!user) {
      console.warn('Twitter OAuth did not return a user');
      return res.redirect('/?error=twitter_auth_failed');
    }
    // This shouldn't happen in the redirect flow, but handle it
    return res.redirect('/');
  })(req, res, next);
});

router.get('/auth/callback/twitter',
  oauthCallbackRateLimit,
  passport.authenticate('twitter', { 
    failureRedirect: '/?error=twitter_auth_failed',
    session: false
  }),
  (req, res) => {
    if (req.user) {
      // Generate JWT token
      const token = generateAuthToken(req.user as any);
      
      // Set secure HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Authentication state is derived from the signed cookie after redirect.
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://askmira.io/'
        : 'http://localhost:5000/'; // Local development
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
router.get('/auth/user', authReadRateLimit, (req, res) => {
  const cookieValue = req.cookies?.auth_token;
  const token = typeof cookieValue === 'string' && cookieValue.length <= 4096
    ? cookieValue
    : '';
  const user = verifyAuthToken(token);

  if (user) {
    res.set('Cache-Control', 'no-store').json({ user, authenticated: true });
    return;
  }

  if (cookieValue !== undefined) {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
  res.set('Cache-Control', 'no-store').json({ user: null, authenticated: false });
});

// Logout
router.post('/auth/logout', authWriteRateLimit, (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// Health check for auth system
router.get('/auth/status', authReadRateLimit, (_req, res) => {
  res.set('Cache-Control', 'no-store').json({
    available: Boolean(
      process.env.TWITTER_CLIENT_ID &&
      process.env.TWITTER_CLIENT_SECRET &&
      (process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET)
    ),
  });
});

export default router;
