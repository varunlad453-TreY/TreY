import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './database';

const GOOGLE_CLIENT_ID_PLACEHOLDER = 'ENTERPRISE_CLIENT_ID_PLACEHOLDER';
const GOOGLE_CLIENT_SECRET_PLACEHOLDER = 'ENTERPRISE_CLIENT_SECRET_PLACEHOLDER';

const getGoogleOAuthConfig = () => {
  const clientID = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const callbackURL = resolveGoogleCallbackUrl();

  if (!clientID || clientID === GOOGLE_CLIENT_ID_PLACEHOLDER) {
    throw new Error('Google OAuth misconfigured: GOOGLE_CLIENT_ID is missing. Use the real Google OAuth Client ID ending with .apps.googleusercontent.com');
  }

  if (clientID.includes('http://') || clientID.includes('https://') || !clientID.endsWith('.apps.googleusercontent.com')) {
    throw new Error(`Google OAuth misconfigured: GOOGLE_CLIENT_ID is invalid (received: ${clientID}). It must look like <id>.apps.googleusercontent.com`);
  }

  if (!clientSecret || clientSecret === GOOGLE_CLIENT_SECRET_PLACEHOLDER) {
    throw new Error('Google OAuth misconfigured: GOOGLE_CLIENT_SECRET is missing. Use the real OAuth client secret from Google Cloud Console.');
  }

  try {
    const parsed = new URL(callbackURL);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('Invalid callback protocol');
    }
  } catch (_error) {
    throw new Error(`Google OAuth misconfigured: callback URL is invalid (${callbackURL}).`);
  }

  return { clientID, clientSecret, callbackURL };
};

const resolveGoogleCallbackUrl = (): string => {
  const configuredCallbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (configuredCallbackUrl) {
    return configuredCallbackUrl;
  }

  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderExternalUrl) {
    return `${renderExternalUrl.replace(/\/+$/, '')}/api/auth/google/callback`;
  }

  return 'http://localhost:5000/api/auth/google/callback';
};

const googleOAuthConfig = getGoogleOAuthConfig();

passport.use(new GoogleStrategy({
    clientID: googleOAuthConfig.clientID,
    clientSecret: googleOAuthConfig.clientSecret,
    callbackURL: googleOAuthConfig.callbackURL
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0].value;
      if (!email) {
        return done(new Error('No email found from Google profile'), undefined);
      }

      const ssoId = profile.id;
      const name = profile.displayName;

      const client = await pool.connect();
      try {
        const userResult = await client.query(
          'SELECT id, email, name, role, organization_id, auth_provider FROM users WHERE sso_provider_id = $1 OR email = $2',
          [ssoId, email.toLowerCase()]
        );
        
        let user = userResult.rows[0];

        if (user) {
          if (user.auth_provider === 'local' || !user.sso_provider_id) {
            await client.query(
              'UPDATE users SET auth_provider = $1, sso_provider_id = $2 WHERE id = $3',
              ['google', ssoId, user.id]
            );
          }
          return done(null, user);
        } else {
          // Auto-provision Enterprise User
          await client.query('BEGIN');
          
          const domain = email.toLowerCase().split('@')[1];
          const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com', 'msn.com', 'live.com'];
          const isPublicDomain = publicDomains.includes(domain);
          
          let orgId;
          let newRole = 'admin'; // Defaults to admin if creating a new org
          
          if (isPublicDomain) {
            // SOLO ISOLATION MODE: Each public email gets their own private workspace
            const orgResult = await client.query(
              "INSERT INTO organizations (name, type) VALUES ($1, 'Freelance Workspace') RETURNING id",
              [`${name}'s Workspace`]
            );
            orgId = orgResult.rows[0].id;
          } else {
            // CORPORATE GROUPING MODE: Find if coworkers already setup an Org
            const existingOrgResult = await client.query(
              "SELECT organization_id FROM users WHERE email LIKE $1 LIMIT 1",
              [`%@${domain}`]
            );
            
            if (existingOrgResult.rows.length > 0) {
              // Join existing corporate organization as a standard operator
              orgId = existingOrgResult.rows[0].organization_id;
              newRole = 'operator';
            } else {
              // First one from the company! Create the corporate Org and make them admin
              const corporateName = domain.split('.')[0];
              const formattedName = corporateName.charAt(0).toUpperCase() + corporateName.slice(1);
              
              const orgResult = await client.query(
                "INSERT INTO organizations (name, type) VALUES ($1, 'Enterprise via SSO') RETURNING id",
                [`${formattedName} Corporate`]
              );
              orgId = orgResult.rows[0].id;
            }
          }
          
          const newUserResult = await client.query(
            "INSERT INTO users (email, name, role, organization_id, auth_provider, sso_provider_id) VALUES ($1, $2, $3, $4, 'google', $5) RETURNING id, email, name, role, organization_id",
            [email.toLowerCase(), name, newRole, orgId, ssoId]
          );
          
          user = newUserResult.rows[0];
          await client.query('COMMIT');
          return done(null, user);
        }
      } catch (err) {
        await client.query('ROLLBACK').catch(() => null);
        return done(err, undefined);
      } finally {
        client.release();
      }
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
));

export default passport;
