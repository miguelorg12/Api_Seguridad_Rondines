import { Router } from "express";
import { oauthQueryValidator } from "@validators/oauth_query.validator";
import * as OauthController from "@controllers/oauth.controller"

const router = Router();

export default router;
