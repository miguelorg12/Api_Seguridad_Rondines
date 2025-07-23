import { Router } from "express";
import {
  authorizeConfirmValidator,
  oauthQueryValidator,
  tokenValidator,
} from "@validators/oauth_query.validator";
import { loginValidator } from "@utils/validators/oauth_query.validator";
import * as OauthController from "@controllers/oauth.controller";

const router = Router();
router.get("/authorize", oauthQueryValidator, OauthController.getAuthorize);
router.post(
  "/authorize/confirm",
  authorizeConfirmValidator,
  OauthController.authorizeConfirm
);
router.post("/login", loginValidator, OauthController.login);
router.post("/token", tokenValidator, OauthController.token);

export default router;
