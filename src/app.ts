import "reflect-metadata";
import express from "express";
import session from "express-session";
import path from "path";
import cors from "cors";

import oauthApiRoutes from "./routes/api/oauth.route";

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Configurar rutas de archivos estáticos y vistas para desarrollo y producción
const isDevelopment = process.env.NODE_ENV !== "production";
const baseDir = isDevelopment ? path.join(__dirname, "..") : __dirname;

app.use(express.static(path.join(baseDir, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(baseDir, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/oauth/v1", oauthApiRoutes);

app.get("/", (req, res) => {
  res.json("Hello, World!");
});

export default app;
