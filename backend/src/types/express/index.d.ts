import { AuthenticatedUser } from '../../middlewares/auth';

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {
      organizationId?: string; // Sometimes used as organization_id
    }
    
    interface Request {
      user?: User;
      ipAddress?: string;
      userAgent?: string;
    }
  }
}

export {};
