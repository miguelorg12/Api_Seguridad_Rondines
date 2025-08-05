import "reflect-metadata";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import path from "path";
import cors from "cors";

import oauthApiRoutes from "./routes/api/oauth.route";
const dbUrl = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@localhost:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Serve static files
const isProduction = process.env.NODE_ENV === "production";
const staticPath = isProduction
  ? path.join(__dirname, "..", "public")
  : path.join(__dirname, "..", "public");
app.use(express.static(staticPath));

// Set view engine
app.set("view engine", "ejs");
const viewsPath = isProduction
  ? path.join(__dirname, "views")
  : path.join(__dirname, "views");
app.set("views", viewsPath);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new (pgSession(session))({
      conString: dbUrl,
      tableName: "session",
    }),
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
