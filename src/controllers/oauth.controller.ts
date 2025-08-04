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
  console.log("🔍 [getAuthorize] Iniciando autorización OAuth");
  console.log("🔍 [getAuthorize] Session ID:", req.sessionID);
  console.log("🔍 [getAuthorize] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  const {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.query;

  console.log("🔍 [getAuthorize] Query parameters:", {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ [getAuthorize] Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  console.log(
    "✅ [getAuthorize] Validation passed, validating authorization request"
  );

  try {
    await oauthService.validateAuthorizationRequest(
      client_id as string,
      redirect_uri as string,
      response_type as string,
      code_challenge as string,
      code_challenge_method as string
    );
    console.log(
      "✅ [getAuthorize] Authorization request validated successfully"
    );
  } catch (error) {
    console.error("❌ [getAuthorize] Authorization validation failed:", error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  if (!req.session.user) {
    console.log(
      "🔍 [getAuthorize] User not authenticated, saving OAuth params to session"
    );

    // Guardar parámetros de OAuth en la sesión
    req.session.oauthParams = {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
    };

    console.log(
      "✅ [getAuthorize] OAuth parameters saved to session:",
      req.session.oauthParams
    );
    console.log("🔍 [getAuthorize] Rendering login page");

    return res.render("login", {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
    });
  }

  console.log("✅ [getAuthorize] User authenticated, rendering authorize page");
  res.render("authorize", {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  });
};

export const getTwoFactor = async (req: Request, res: Response) => {
  console.log("🔍 [getTwoFactor] Iniciando página de 2FA");
  console.log("🔍 [getTwoFactor] Session ID:", req.sessionID);
  console.log("🔍 [getTwoFactor] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  if (!req.session.is2faPending) {
    console.log("❌ [getTwoFactor] No 2FA session found, redirecting to login");
    return res.redirect("/oauth/v1/login");
  }

  console.log("✅ [getTwoFactor] 2FA session found, rendering 2FA page");
  res.render("auth2");
};

export const login = async (req: Request, res: Response) => {
  console.log("🔍 [login] Iniciando proceso de login");
  console.log("🔍 [login] Session ID:", req.sessionID);
  console.log("🔍 [login] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  const { email, password } = req.body;
  console.log("🔍 [login] Login attempt for email:", email);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ [login] Validation errors:", errors.array());
    return res.status(422).json({ errors: errors.array() });
  }

  console.log("✅ [login] Validation passed, attempting user login");
  const user = await oauthService.loginUser(email, password);
  if (!user) {
    console.log("❌ [login] Invalid credentials for email:", email);
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  console.log("✅ [login] User authenticated successfully:", {
    userId: user.id,
    email: user.email,
  });

  // Verificar que los parámetros de OAuth estén presentes en la sesión
  const {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.session.oauthParams || {};

  console.log(
    "🔍 [login] OAuth parameters in session:",
    req.session.oauthParams
  );

  if (
    !client_id ||
    !redirect_uri ||
    response_type !== "code" ||
    !code_challenge ||
    !code_challenge_method
  ) {
    console.error(
      "❌ [login] Missing OAuth parameters in session:",
      req.session.oauthParams
    );
    return res.status(400).json({
      error:
        "Parámetros de autorización faltantes. Por favor, inicie el proceso de autorización nuevamente.",
    });
  }

  console.log("✅ [login] OAuth parameters validated, setting up 2FA");

  // Guardar información de 2FA en la sesión
  req.session.is2faPending = {
    userId: user.id,
    email: user.email,
  };

  console.log("✅ [login] 2FA session created:", req.session.is2faPending);

  console.log("🔍 [login] Generating 2FA code");
  const code = await oauthService.generateCodeTwoFactor(user.id);
  console.log("✅ [login] 2FA code generated for user:", user.id);

  try {
    console.log("🔍 [login] Sending email with 2FA code");
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
    console.log("✅ [login] Email sent successfully");
  } catch (error) {
    console.error("❌ [login] Error sending email:", error);
    return res.status(500).json({ error: "Error sending email" });
  }

  console.log("✅ [login] Login process completed successfully");

  // Forzar guardado de sesión antes de responder
  console.log("🔍 [login] Forcing session save");
  req.session.save((err) => {
    if (err) {
      console.error("❌ [login] Error saving session:", err);
    } else {
      console.log("✅ [login] Session saved successfully");
    }
  });

  // Construir URL de redirección con parámetros de OAuth y email como fallback
  const oauthParams = new URLSearchParams({
    client_id: client_id as string,
    redirect_uri: redirect_uri as string,
    response_type: response_type as string,
    code_challenge: code_challenge as string,
    code_challenge_method: code_challenge_method as string,
  });

  const redirectUrl = `/oauth/v1/2fa?${oauthParams.toString()}`;
  console.log("🔍 [login] Redirecting to:", redirectUrl);

  res.json({
    success: true,
    redirect: redirectUrl,
  });
};

export const authorizeConfirm = async (req: Request, res: Response) => {
  console.log("🔍 [authorizeConfirm] Iniciando confirmación de autorización");
  console.log("🔍 [authorizeConfirm] Session ID:", req.sessionID);
  console.log("🔍 [authorizeConfirm] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  const {
    action,
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.body;

  console.log("🔍 [authorizeConfirm] Request body:", {
    action,
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  });

  const errors = validationResult(req.query);
  if (!errors.isEmpty()) {
    console.log("❌ [authorizeConfirm] Validation errors:", errors.array());
    return res.status(422).json({ errors: errors.array() });
  }

  console.log("✅ [authorizeConfirm] Validation passed");

  if (action === "deny") {
    console.log("🔍 [authorizeConfirm] User denied authorization");
    return res.json({
      success: false,
      redirect: `${redirect_uri}?error=access_denied`,
    });
  }

  if (!req.session.user) {
    console.log("❌ [authorizeConfirm] User not authenticated");
    return res.status(401).json({ error: "User not authenticated" });
  }

  console.log(
    "✅ [authorizeConfirm] User authenticated, validating authorization request"
  );

  try {
    await oauthService.validateAuthorizationRequest(
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method
    );
    console.log("✅ [authorizeConfirm] Authorization request validated");
  } catch (error) {
    console.error(
      "❌ [authorizeConfirm] Authorization validation failed:",
      error
    );
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  console.log("🔍 [authorizeConfirm] Generating authorization code");
  const code = await oauthService.generateAuthorizationCode(
    req.session.user.id,
    client_id,
    code_challenge,
    code_challenge_method
  );
  console.log("✅ [authorizeConfirm] Authorization code generated");

  const redirectUrl = `${redirect_uri}?code=${code}`;
  console.log("🔍 [authorizeConfirm] Redirecting to:", redirectUrl);

  return res.json({
    success: true,
    redirect: redirectUrl,
  });
};

export const token = async (req: Request, res: Response) => {
  console.log("🔍 [token] Iniciando generación de token");
  console.log("🔍 [token] Session ID:", req.sessionID);
  console.log("🔍 [token] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  const { grant_type, code, redirect_uri, client_id, code_verifier } = req.body;
  console.log("🔍 [token] Request body:", {
    grant_type,
    code: code ? "present" : "missing",
    redirect_uri,
    client_id,
    code_verifier: code_verifier ? "present" : "missing",
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ [token] Validation errors:", errors.array());
    return res.status(422).json({ errors: errors.array() });
  }

  console.log("✅ [token] Validation passed, generating access token");

  try {
    const accessToken = await oauthService.generateAccessToken(
      grant_type,
      code,
      redirect_uri,
      client_id,
      code_verifier
    );
    console.log("✅ [token] Access token generated successfully");
    return res.json(accessToken);
  } catch (error) {
    console.error("❌ [token] Error generating access token:", error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const verifyTwoFactorCode = async (req: Request, res: Response) => {
  console.log("🔍 [verifyTwoFactorCode] Iniciando verificación de código 2FA");
  console.log("🔍 [verifyTwoFactorCode] Session ID:", req.sessionID);
  console.log("🔍 [verifyTwoFactorCode] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  // Verificar si hay parámetros OAuth en la query string como fallback
  const queryParams = req.query;
  console.log("🔍 [verifyTwoFactorCode] Query parameters:", queryParams);

  const { code } = req.body;
  console.log("🔍 [verifyTwoFactorCode] Code received:", code);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ [verifyTwoFactorCode] Validation errors:", errors.array());
    return res.status(422).json({ errors: errors.array() });
  }

  console.log("✅ [verifyTwoFactorCode] Validation passed");

  // Intentar obtener parámetros de la sesión primero
  let {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.session.oauthParams || {};

  console.log("🔍 [verifyTwoFactorCode] OAuth parameters from session:", {
    client_id,
    redirect_uri,
    response_type,
    code_challenge,
    code_challenge_method,
  });

  // Si no están en la sesión, intentar obtenerlos de la query string
  if (
    !client_id ||
    !redirect_uri ||
    response_type !== "code" ||
    !code_challenge ||
    !code_challenge_method
  ) {
    console.log(
      "🔍 [verifyTwoFactorCode] Session parameters missing, trying query parameters"
    );

    const queryClientId = req.query.client_id as string;
    const queryRedirectUri = req.query.redirect_uri as string;
    const queryResponseType = req.query.response_type as string;
    const queryCodeChallenge = req.query.code_challenge as string;
    const queryCodeChallengeMethod = req.query.code_challenge_method as string;

    if (
      queryClientId &&
      queryRedirectUri &&
      queryResponseType === "code" &&
      queryCodeChallenge &&
      queryCodeChallengeMethod
    ) {
      console.log(
        "✅ [verifyTwoFactorCode] Using query parameters as fallback"
      );
      client_id = queryClientId;
      redirect_uri = queryRedirectUri;
      response_type = queryResponseType;
      code_challenge = queryCodeChallenge;
      code_challenge_method = queryCodeChallengeMethod;

      // Guardar en la sesión para futuras peticiones
      req.session.oauthParams = {
        client_id,
        redirect_uri,
        response_type,
        code_challenge,
        code_challenge_method,
      };
      console.log(
        "✅ [verifyTwoFactorCode] OAuth parameters restored to session from query"
      );
    } else {
      console.error(
        "❌ [verifyTwoFactorCode] OAuth parameters missing in both session and query"
      );
      return res.status(400).json({
        error:
          "Parámetros de autorización faltantes. Por favor, inicie el proceso de autorización nuevamente.",
      });
    }
  }

  console.log("✅ [verifyTwoFactorCode] OAuth parameters validated");

  if (!req.session.is2faPending) {
    console.error("❌ [verifyTwoFactorCode] 2FA session missing:", req.session);
    console.log(
      "🔍 [verifyTwoFactorCode] Attempting to recover 2FA session from query parameters"
    );

    // Intentar recuperar la sesión 2FA usando el código como referencia
    // Esto es un fallback temporal mientras se resuelve el problema de sesión
    const userEmail = req.query.email as string;
    if (userEmail) {
      console.log(
        "🔍 [verifyTwoFactorCode] Found email in query, attempting to find user"
      );
      const user = await AppDataSource.getRepository(User).findOneBy({
        email: userEmail,
      });
      if (user) {
        console.log(
          "✅ [verifyTwoFactorCode] User found by email, creating temporary 2FA session"
        );
        req.session.is2faPending = {
          userId: user.id,
          email: user.email,
        };
      } else {
        console.error(
          "❌ [verifyTwoFactorCode] User not found by email:",
          userEmail
        );
        return res.status(400).json({
          error:
            "Sesión de autenticación faltante. Por favor, inicie el proceso de autorización nuevamente.",
        });
      }
    } else {
      return res.status(400).json({
        error:
          "Sesión de autenticación faltante. Por favor, inicie el proceso de autorización nuevamente.",
      });
    }
  }

  console.log("✅ [verifyTwoFactorCode] 2FA session found");

  const { userId, email } = req.session.is2faPending;
  console.log("🔍 [verifyTwoFactorCode] Verifying 2FA code for user:", {
    userId,
    email,
  });

  const isValid = await oauthService.verifyTwoFactorCode(userId, code);
  console.log("🔍 [verifyTwoFactorCode] 2FA verification result:", {
    email,
    isValid,
  });

  if (!isValid) {
    console.log("❌ [verifyTwoFactorCode] Invalid 2FA code for user:", email);
    return res.status(401).json({ error: "Codigo incorrecto" });
  }

  console.log("✅ [verifyTwoFactorCode] 2FA code verified successfully");

  console.log("🔍 [verifyTwoFactorCode] Setting user in session");
  req.session.user = await AppDataSource.getRepository(User).findOneBy({
    id: userId,
  });
  delete req.session.is2faPending;

  console.log("✅ [verifyTwoFactorCode] User session set, 2FA session cleared");

  // Forzar guardado de sesión antes de responder
  console.log("🔍 [verifyTwoFactorCode] Forcing session save");
  req.session.save((err) => {
    if (err) {
      console.error("❌ [verifyTwoFactorCode] Error saving session:", err);
    } else {
      console.log("✅ [verifyTwoFactorCode] Session saved successfully");
    }
  });

  // Asegurar que los parámetros de OAuth estén disponibles para la siguiente redirección
  const oauthParams = new URLSearchParams({
    client_id: client_id as string,
    redirect_uri: redirect_uri as string,
    response_type: response_type as string,
    code_challenge: code_challenge as string,
    code_challenge_method: code_challenge_method as string,
  });

  const redirectUrl = `/oauth/v1/authorize?${oauthParams.toString()}`;
  console.log("🔍 [verifyTwoFactorCode] Redirecting to:", redirectUrl);

  return res.json({
    success: true,
    redirect: redirectUrl,
  });
};

export const getMe = async (req: Request, res: Response) => {
  console.log("🔍 [getMe] Iniciando verificación de usuario");
  console.log("🔍 [getMe] Session ID:", req.sessionID);
  console.log("🔍 [getMe] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ [getMe] No Bearer token found in Authorization header");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("❌ [getMe] No token found in Authorization header");
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!JWT_SECRET) {
    console.log("❌ [getMe] JWT_SECRET not configured");
    return res.status(500).json({ error: "JWT secret is not configured" });
  }

  try {
    console.log("🔍 [getMe] Verifying JWT token");
    const decode = jwt.verify(token, JWT_SECRET as string);
    console.log("✅ [getMe] JWT decoded successfully:", decode);

    console.log("🔍 [getMe] Fetching user from database");
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

    if (!user) {
      console.log("❌ [getMe] User not found in database");
      return res.status(401).json({ error: "User not found" });
    }

    console.log("✅ [getMe] User found:", { id: user.id, email: user.email });
    return res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("❌ [getMe] JWT verification error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  console.log("🔍 [refreshToken] Iniciando refresh de token");
  console.log("🔍 [refreshToken] Session ID:", req.sessionID);
  console.log("🔍 [refreshToken] Session data:", {
    oauthParams: req.session.oauthParams,
    is2faPending: req.session.is2faPending,
    user: req.session.user ? "present" : "not present",
  });

  const { refresh_token } = req.body;
  if (!refresh_token) {
    console.log("❌ [refreshToken] No refresh token provided");
    return res.status(400).json({ error: "No refresh token provided" });
  }

  console.log("🔍 [refreshToken] Refresh token provided, verifying");

  try {
    const decoded: any = jwt.verify(refresh_token, JWT_SECRET as string);
    console.log("✅ [refreshToken] Refresh token verified:", decoded);

    const user = await AppDataSource.getRepository(User).findOneBy({
      id: decoded.sub,
    });

    if (!user) {
      console.log("❌ [refreshToken] User not found for refresh token");
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    console.log("✅ [refreshToken] User found, generating new access token");
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    console.log("✅ [refreshToken] New access token generated successfully");
    return res.json({ accessToken });
  } catch (error) {
    console.error("❌ [refreshToken] Error refreshing token:", error);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
