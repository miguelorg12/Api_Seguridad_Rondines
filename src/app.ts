import "reflect-metadata";
import express from "express";
import session from "express-session";
import path from "path";
import cors from "cors";

import oauthApiRoutes from "./routes/api/oauth.route";

const app = express();

// Configurar trust proxy para manejar proxies (importante para producción con HTTPS)
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

// Configuración de sesiones optimizada para HTTPS y producción
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: true,
    saveUninitialized: false,
    cookie: {
      secure: true, // Habilitado para HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: "lax",
      path: "/",
    },
    name: "oauth_session",
    rolling: true, // Renovar la cookie en cada request
    unset: "destroy", // Destruir la sesión al cerrar el navegador
  })
);

// Middleware de debug para sesiones
app.use((req, res, next) => {
  console.log(`🔍 [Session Debug] Session ID: ${req.sessionID}`);
  if (req.session) {
    console.log(`🔍 [Session Debug] Session data:`, {
      oauthParams: req.session.oauthParams ? "present" : "missing",
      is2faPending: req.session.is2faPending ? "present" : "missing",
      user: req.session.user ? "present" : "missing",
    });
  }
  next();
});

app.use("/oauth/v1", oauthApiRoutes);

app.get("/", (req, res) => {
  res.json("Hello, World!");
});

export default app;
