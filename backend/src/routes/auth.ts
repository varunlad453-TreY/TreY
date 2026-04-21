import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { authenticate } from '../middlewares/auth';
import { pool } from '../config/database';
import { AuditRepository } from '../repositories/auditRepository';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middlewares/auth';

const router = Router();
const authService = new AuthService();
const auditRepository = new AuditRepository(pool);
const authController = new AuthController({ authService, auditRepository });

// Existing local auth
router.post('/register', authController.register);
router.post('/login', authController.login);
/* @ts-ignore */
router.get('/me', authenticate, authController.me);
/* @ts-ignore */
router.post('/logout', authenticate, authController.logout);

// ============================================
// ENTERPRISE SSO ROUTES (Google Workspace)
// ============================================
// Step 1: Redirect to Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2: Google calls this back
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=sso_failed' }),
  (req, res) => {
    // Successful authentication, generate JWT
    const user = req.user as any;
    
    // We must pass the token to the frontend somehow. 
    // Best way in a detached frontend: redirect to the frontend with a short-lived auth code or the token itself
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
    
    // Redirecting to the frontend Dashboard / SSO success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/sso-success?token=${token}`);
  }
);

export default router;
