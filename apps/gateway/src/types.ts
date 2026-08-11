export interface Env {
  DB: D1Database;
  LOG_BUCKET?: R2Bucket;
  AI?: any;
  ASSETS?: Fetcher;
}

export type GatewayContext = {
  Bindings: Env;
  Variables: {
    keyRecord: any;
  };
};
