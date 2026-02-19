import "express";

declare module "express-serve-static-core" {
  interface Request {
    user: {
      id: string;
      role: string;
    };
  }
  interface Response {
    user: {
      id: string;
      role: string;
    };
  }
}
