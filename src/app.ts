import "reflect-metadata";
import express from "express";
import session from "express-session";
import path from "path";
import oauthViewRoutes from "./routes/views/oauth.route";
import oauthApiRoutes from "./routes/api/oauth.route";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/oauth/v1", oauthViewRoutes);


app.get("/", (req, res) => {
  res.json("Hello, World!");
});

export default app;