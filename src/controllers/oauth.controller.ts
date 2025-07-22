import { Request, Response } from "express";
import { OauthService } from "@services/oauth.service";
import { validationResult } from "express-validator";
import { AppDataSource } from "@configs/data-source";
import { User } from "@interfaces/entity/user.entity";

const oauthService = new OauthService();

export const getAuthorize = async (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.query;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  await oauthService.validateAuthorizationRequest(
    client_id as string,
    redirect_uri as string,
    response_type as string,
    code_challenge as string,
    code_challenge_method as string
  );
  if (!req.session.user) {
    req.session.oauthParams = {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
    };
    return res.render("login", {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
    });
  }

  res.render("authorize", {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(422).json({ errors: errors.array() });
  }
  const user = await oauthService.loginUser(email, password);
  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }
  req.session.user = user;
  const {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.session.oauthParams || {};
  if (
    !client_id ||
    !redirect_uri ||
    response_type !== "code" ||
    !code_challenge ||
    !code_challenge_method
  ) {
    return res.status(400).json({ error: "Invalid authorization request" });
  }
  res.render("authorize", {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  });
};
