import { Request, Response } from "express";
import { OauthService } from "@services/oauth.service";
import { validationResult } from "express-validator";
import { AppDataSource } from "@configs/data-source";
import { User } from "@interfaces/entity/user.entity";
import { EmailService } from "@services/email.service";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import path from "path";

const oauthService = new OauthService();
const emailService = new EmailService();
const JWT_SECRET = process.env.JWT_SECRET;
export const getAuthorize = async (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.query;

  console.log("OAuth authorization request:", {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  });

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
    // Guardar parámetros de OAuth en la sesión
    req.session.oauthParams = {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
    };

    console.log("OAuth parameters saved to session:", req.session.oauthParams);

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

export const getTwoFactor = async (req: Request, res: Response) => {
  if (!req.session.is2faPending) {
    return res.redirect("/oauth/v1/login");
  }
  res.render("auth2");
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

  // Verificar que los parámetros de OAuth estén presentes en la sesión
  const {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.session.oauthParams || {};

  console.log("OAuth parameters in session:", req.session.oauthParams);

  if (
    !client_id ||
    !redirect_uri ||
    response_type !== "code" ||
    !code_challenge ||
    !code_challenge_method
  ) {
    console.error(
      "Missing OAuth parameters in session:",
      req.session.oauthParams
    );
    return res.status(400).json({
      error:
        "Parámetros de autorización faltantes. Por favor, inicie el proceso de autorización nuevamente.",
    });
  }

  // Guardar información de 2FA en la sesión
  req.session.is2faPending = {
    userId: user.id,
    email: user.email,
  };

  const code = await oauthService.generateCodeTwoFactor(user.id);

  try {
    const templatePath = path.join(__dirname, "../views/email.ejs");
    const htmlContent = await ejs.renderFile(templatePath, {
      userEmail: user.email,
      otpCode: code,
    });
    emailService.sendEmail({
      to: user.email,
      subject: "Login Notification",
      text: `Codigo de autenticación`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Error sending email" });
  }

  console.log("User logged in:", user);

  // Construir URL de redirección con parámetros de OAuth
  const oauthParams = new URLSearchParams({
    client_id: client_id as string,
    redirect_uri: redirect_uri as string,
    response_type: response_type as string,
    code_challenge: code_challenge as string,
    code_challenge_method: code_challenge_method as string,
  });

  res.json({
    success: true,
    redirect: `/oauth/v1/2fa?${oauthParams.toString()}`,
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
  return res.json(accessToken);
};

export const verifyTwoFactorCode = async (req: Request, res: Response) => {
  const { code } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.session.oauthParams || {};

  // Verificar si los parámetros de OAuth están presentes
  if (
    !client_id ||
    !redirect_uri ||
    response_type !== "code" ||
    !code_challenge ||
    !code_challenge_method
  ) {
    console.error(
      "OAuth parameters missing in session:",
      req.session.oauthParams
    );
    return res.status(400).json({
      error:
        "Parámetros de autorización faltantes. Por favor, inicie el proceso de autorización nuevamente.",
    });
  }
  if (!req.session.is2faPending) {
    console.error("2FA session missing:", req.session);
    return res.status(400).json({
      error:
        "Sesión de autenticación faltante. Por favor, inicie el proceso de autorización nuevamente.",
    });
  }
  const { userId, email } = req.session.is2faPending;
  const isValid = await oauthService.verifyTwoFactorCode(userId, code);
  console.log("2FA verification for user:", email, "isValid:", isValid);
  if (!isValid) {
    return res.status(401).json({ error: "Codigo incorrecto" });
  }
  req.session.user = await AppDataSource.getRepository(User).findOneBy({
    id: userId,
  });
  delete req.session.is2faPending;

  console.log("2FA verified for user:", email);

  // Asegurar que los parámetros de OAuth estén disponibles para la siguiente redirección
  const oauthParams = new URLSearchParams({
    client_id: client_id as string,
    redirect_uri: redirect_uri as string,
    response_type: response_type as string,
    code_challenge: code_challenge as string,
    code_challenge_method: code_challenge_method as string,
  });

  return res.json({
    success: true,
    redirect: `/oauth/v1/authorize?${oauthParams.toString()}`,
  });
};

export const getMe = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!JWT_SECRET) {
    return res.status(500).json({ error: "JWT secret is not configured" });
  }
  try {
    const decode = jwt.verify(token, JWT_SECRET as string);
    console.log("JWT decoded:", decode);
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(decode.sub) },
      relations: ["role", "branch", "branches"],
      select: {
        id: true,
        name: true,
        last_name: true,
        curp: true,
        email: true,
        active: true,
        role: {
          id: true,
          name: true,
        },
        branch: {
          id: true,
          name: true,
          address: true,
        },
        branches: {
          id: true,
          name: true,
          address: true,
        },
      },
    });
    return res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: "No refresh token provided" });
  }
  try {
    const decoded: any = jwt.verify(refresh_token, JWT_SECRET as string);
    const user = await AppDataSource.getRepository(User).findOneBy({
      id: decoded.sub,
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
