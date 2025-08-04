import "reflect-metadata";
import express from "express";
import session from "express-session";
import path from "path";
import cors from "cors";

import oauthApiRoutes from "./routes/api/oauth.route";

const app = express();

// Configurar trust proxy para HTTPS y reverse proxy
app.set("trust proxy", 1);

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Configurar rutas de archivos estáticos y vistas para desarrollo y producción
const isDevelopment = process.env.NODE_ENV !== "production";
const isCompiled = __dirname.includes("dist");

// Si estamos en el directorio dist (compilado), usar rutas relativas a dist
// Si estamos en src (desarrollo), usar rutas relativas al directorio raíz
const baseDir = isCompiled ? __dirname : path.join(__dirname, "..");

// Log temporal para debug
console.log("🔍 Debug info:");
console.log("__dirname:", __dirname);
console.log("isCompiled:", isCompiled);
console.log("baseDir:", baseDir);
console.log("views path:", path.join(baseDir, "views"));
console.log("public path:", path.join(baseDir, "public"));

app.use(express.static(path.join(baseDir, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(baseDir, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false, // Cambiado a false para mejor rendimiento
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Solo true en producción con HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    },
    name: "oauth_session",
    rolling: true, // Renovar la cookie en cada request
    unset: "destroy", // Destruir la sesión al cerrar el navegador
    // Configuración adicional para producción
    proxy: process.env.NODE_ENV === "production", // Confiar en el proxy en producción
  })
);

// Middleware de debug para sesiones
app.use((req, res, next) => {
  console.log("🔍 [Session Debug] Request URL:", req.url);
  console.log("🔍 [Session Debug] Session ID:", req.sessionID);
  console.log("🔍 [Session Debug] Session exists:", !!req.session);
  console.log("🔍 [Session Debug] Session data:", {
    oauthParams: req.session?.oauthParams ? "present" : "not present",
    is2faPending: req.session?.is2faPending ? "present" : "not present",
    user: req.session?.user ? "present" : "not present",
  });
  console.log("🔍 [Session Debug] Headers:", {
    cookie: req.headers.cookie ? "present" : "not present",
    "x-forwarded-proto": req.headers["x-forwarded-proto"],
    "x-forwarded-for": req.headers["x-forwarded-for"],
  });
  next();
});

app.use("/oauth/v1", oauthApiRoutes);

app.get("/", (req, res) => {
  res.json("Hello, World!");
});

// Endpoint de prueba para sesiones
app.get("/test-session", (req, res) => {
  if (!req.session.testCount) {
    req.session.testCount = 0;
  }
  req.session.testCount++;

  res.json({
    sessionId: req.sessionID,
    testCount: req.session.testCount,
    sessionExists: !!req.session,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint para limpiar sesión de prueba
app.get("/clear-test-session", (req, res) => {
  delete req.session.testCount;
  res.json({
    message: "Test session cleared",
    sessionId: req.sessionID,
  });
});

export default app;
