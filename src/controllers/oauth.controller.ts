import { Request, Response } from "express";
import { OauthService } from "@services/oauth.service";
import { validationResult } from "express-validator";
import { AppDataSource } from "@configs/data-source";
import { User } from "@interfaces/entity/user.entity";

const oauthService = new OauthService();
const userRepository = AppDataSource.getRepository(User);

export const getAuthorize = async (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type } = req.query;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await oauthService.validateAuthorizationRequest(
    client_id as string,
    redirect_uri as string,
    response_type as string
  );
  if (!req.session.user) {
    req.session.oauthParams = { client_id, redirect_uri, response_type };
    return res.render("login", {
      client_id,
      redirect_uri,
      response_type,
      error: null,
    });
  }

  res.render("authorize", {
    client_id,
    redirect_uri,
    user: req.session.user || null,
  });
};

export const postLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("login", {
      error: errors.array()[0]?.msg || "Error en los datos",
      client_id: req.body.client_id,
      redirect_uri: req.body.redirect_uri,
      response_type: req.body.response_type,
    });
  }
  try {
    const user = await oauthService.loginUser(email, password);
    if (!user) {
      return res.status(401).render("login", {
        error: "Credenciales invalidas",
        client_id: req.body.client_id,
        redirect_uri: req.body.redirect_uri,
        response_type: req.body.response_type,
      });
    }
    req.session.user = user;
    if (req.session.oauthParams) {
      const { client_id, redirect_uri, response_type } =
        req.session.oauthParams;
      delete req.session.oauthParams;
      return res.redirect(
        `/oauth/v1/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}`
      );
    }
    return res.status(200).json({ message: "Login successful", user });
  } catch (error: any) {
    return res.status(401).render("login", {
      error: "Credenciales invalidas",
      client_id: req.body.client_id,
      redirect_uri: req.body.redirect_uri,
      response_type: req.body.response_type,
    });
  }
};
