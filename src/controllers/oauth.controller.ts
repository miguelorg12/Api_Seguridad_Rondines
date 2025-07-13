import { OauthService } from "@services/oauth.service";
import { Request, Response } from "express";
import { validationResult } from "express-validator";

const oauthService = new OauthService();

export const authorize = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const query = req.query as any;
    const data = await oauthService.authorize(query);
    const sessionUser = req.session?.user ?? null;
    const templateData = {
      ...data,
      sessionUser,
      originalQuery: encodeURIComponent(req.originalUrl.split("?")[1] || ""),
      codeChallenge: query.code_challenge,
      codeChallengeMethod: query.code_challenge_method,
      state: query.state,
    };

    if (!sessionUser) {
      return res.render('authorize', {
        showLogin: true,
        showConsent: false,
        ...templateData
      });
    }

    return res.render('authorize', {
      showLogin: false,
      showConsent: true,
      ...templateData
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
