import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: any;
  }
  interface Session {
    oauthParams?: {
      client_id: any;
      redirect_uri: any;
      response_type: any;
    };
  }
}
