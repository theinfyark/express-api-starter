import type {
  Express,
  Request,
  RequestHandler,
  ErrorRequestHandler,
  Response,
} from "express";

export declare class AppError extends Error {
  name: "AppError";
  statusCode: number;
  details?: unknown;
  isOperational: boolean;
  constructor(message: string, statusCode?: number, details?: unknown);
}

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "email"
  | "array"
  | "object";

export interface FieldRule {
  type?: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp | string;
  enum?: unknown[];
  validate?: (
    value: unknown,
    body: Record<string, unknown>,
  ) => string | null | undefined;
}

export function validate(
  schema: Record<string, FieldRule>,
  source?: "body" | "query" | "params",
): RequestHandler;

export interface JwtMiddlewareOptions {
  secret?: string;
  algorithms?: string[];
  optional?: boolean;
  getToken?: (req: Request) => string | null | undefined;
}

export function createJwtMiddleware(
  options?: JwtMiddlewareOptions,
): RequestHandler;

export interface SignTokenOptions {
  secret?: string;
  expiresIn?: string | number;
}

export function signToken(
  payload: object,
  options?: SignTokenOptions,
): string;

export interface LoggerOptions {
  format?: string;
  skip?: (req: Request, res: Response) => boolean;
}

export function createLogger(options?: LoggerOptions): RequestHandler;

export function requestId(): RequestHandler;

export declare const notFoundHandler: RequestHandler;

export interface ErrorHandlerOptions {
  includeStack?: boolean;
}

export function errorHandler(
  options?: ErrorHandlerOptions,
): ErrorRequestHandler;

export interface HealthOptions {
  path?: string;
  handler?: RequestHandler;
}

export function mountHealth(app: Express, options?: HealthOptions): void;

export interface CreateServerOptions {
  cors?: boolean | Record<string, unknown>;
  helmet?: boolean | Record<string, unknown>;
  rateLimit?: boolean | Record<string, unknown>;
  logger?: boolean | { format?: string };
  health?: boolean | { path?: string };
  json?: boolean;
  /** Enable JWT globally (secret string) or pass custom middleware */
  jwt?: string | boolean | RequestHandler;
  /** Extra middleware after built-ins */
  middleware?: RequestHandler[];
  trustProxy?: boolean;
}

export type StarterApp = Express & {
  jwt: RequestHandler;
  notFound: () => void;
  errors: () => void;
};

export function createServer(options?: CreateServerOptions): StarterApp;

declare module "express-serve-static-core" {
  interface Request {
    id?: string;
    user?: unknown;
  }
}
