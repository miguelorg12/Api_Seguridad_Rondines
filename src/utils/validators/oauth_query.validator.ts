import { AppDataSource } from "@configs/data-source";
import { OauthClientsEntity } from "@interfaces/entity/oauth_clients.entity";
import { isIn } from "class-validator";
import { param, query, body } from "express-validator";

export const oauthQueryValidator = [
  query("response_type")
    .notEmpty()
    .withMessage("El campo response_type es obligatorio")
    .isIn(["code", "token"])
    .withMessage("El response_type debe ser 'code' o 'token'"),
  query("client_id")
    .notEmpty()
    .withMessage("El campo client_id es obligatorio")
    .custom(async (client_id: string) => {
      const clientRepo = AppDataSource.getRepository(OauthClientsEntity);
      const client = await clientRepo.findOne({ where: { client_id } });
      if (!client) {
        throw new Error("El client_id no existe");
      }
      return true;
    }),
  query("redirect_uri")
    .notEmpty()
    .withMessage("El campo redirect_uri es obligatorio")
    .custom(async (redirect_uri: string, { req }) => {
      const client_id = req?.query?.client_id as string;
      if (!client_id) {
        throw new Error(
          "El client_id es obligatorio para validar el redirect_uri"
        );
      }
      const clientRepo = AppDataSource.getRepository(OauthClientsEntity);
      const client = await clientRepo.findOne({
        where: { client_id: client_id },
      });
      if (!client) {
        throw new Error("El client_id no existe");
      }
      if (client.redirect_uri !== redirect_uri) {
        throw new Error(
          "El redirect_uri no coincide con el registrado para este client_id"
        );
      }
      return true;
    }),
  query("code_challenge")
    .notEmpty()
    .withMessage("El campo code_challenge es obligatorio")
    .isString()
    .withMessage("El code_challenge debe ser una cadena de texto"),
  query("code_challenge_method")
    .notEmpty()
    .withMessage("El campo code_challenge_method es obligatorio")
    .isIn(["S256"])
    .withMessage("El code_challenge_method debe ser 'S256'"),
];

export const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("El campo email es obligatorio")
    .isEmail()
    .withMessage("El email debe ser válido"),
  body("password").notEmpty().withMessage("El campo password es obligatorio"),
];
