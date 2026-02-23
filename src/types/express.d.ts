import "express";

declare module "express-serve-static-core" {
  interface Request {
    user: {
      _id: string;
      role: string;
    };
  }
  interface Response {
    user: {
      _id: string;
      role: string;
    };
  }
}
