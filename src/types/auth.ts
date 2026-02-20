import type { JwtPayload } from "jsonwebtoken";

/**
 * JWT payload interface
 */
export interface TokenPayload extends JwtPayload {
  id: string;
}
