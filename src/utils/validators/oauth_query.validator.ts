import { param, query } from "express-validator";

export const oauthQueryValidator = [
  query("response_type")
    .notEmpty()
    .withMessage("El campo response_type es obligatorio")
    .isIn(["code", "token"])
    .withMessage("El response_type debe ser 'code' o 'token'"),
  query("client_id")
    .notEmpty()
    .withMessage("El campo client_id es obligatorio"),
  query("redirect_uri")
    .notEmpty()
    .withMessage("El campo redirect_uri es obligatorio"),
  query("code_challenge")
    .notEmpty()
    .withMessage("El campo code_challenge es obligatorio"),
  query("code_challenge_method")
    .notEmpty()
    .withMessage("El campo code_challenge_method es obligatorio"),
];
