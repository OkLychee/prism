export interface Env {
  DB: D1Database;
  LOG_BUCKET?: R2Bucket;
  AI?: any;
  ASSETS?: Fetcher;
  TURNSTILE_SECRET_KEY?: string;
}

export type GatewayContext = {
  Bindings: Env;
  Variables: {
    keyRecord: any;
  };
};
