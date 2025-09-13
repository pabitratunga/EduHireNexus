import "express";

declare global {
  namespace Express {
    interface UserPayload {
      uid: string;
      email?: string;
      email_verified?: boolean;
      role?: string;
      [key: string]: any;
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

export {};