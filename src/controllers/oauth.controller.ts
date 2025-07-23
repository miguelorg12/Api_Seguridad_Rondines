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
    console.log("Invalid credentials for email:", email);
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
  console.log("User logged in:", user);
  res.json({
    success: true,
    redirect: `/oauth/v1/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`,
  });
};

export const authorizeConfirm = async (req: Request, res: Response) => {
  const {
    action,
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.body;
  const errors = validationResult(req.query);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(422).json({ errors: errors.array() });
  }
  if (action === "deny") {
    return res.json({
      success: false,
      redirect: `${redirect_uri}?error=access_denied`,
    });
  }
  if (!req.session.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  await oauthService.validateAuthorizationRequest(
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method
  );
  const code = await oauthService.generateAuthorizationCode(
    req.session.user.id,
    client_id,
    code_challenge,
    code_challenge_method
  );
  return res.json({
    success: true,
    redirect: `${redirect_uri}?code=${code}`,
  });
};

export const token = async (req: Request, res: Response) => {
  const { grant_type, code, redirect_uri, client_id, code_verifier } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const accessToken = await oauthService.generateAccessToken(
    grant_type,
    code,
    redirect_uri,
    client_id,
    code_verifier
  );
  console.log("Access token generated:", accessToken);
  return res.json({ accessToken });
};
