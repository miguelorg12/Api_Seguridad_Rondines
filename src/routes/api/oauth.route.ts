import { Router } from "express";
import { oauthQueryValidator } from "@validators/oauth_query.validator";
import { loginValidator } from "@utils/validators/oauth_query.validator";
import * as OauthController from "@controllers/oauth.controller";

const router = Router();
router.get("/authorize", oauthQueryValidator, OauthController.getAuthorize);
router.post("/login", loginValidator, OauthController.login);
export default router;
