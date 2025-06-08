import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    choirContext?: {
      choirId: string;
      role: string;
      // Add other properties as needed
    };
  }
} 