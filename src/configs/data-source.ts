import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "@entities/user.entity";
import { Oauth_Acceess_Tokens } from "@entities/oauth_access_tokens.entity";
import { Oauth_Auth_Codes } from "@entities/oauth_auth_codes.entity";
import { Oauth_Clients } from "@entities/oauth_clients.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: true,
  entities: [User, Oauth_Acceess_Tokens, Oauth_Auth_Codes, Oauth_Clients],
  subscribers: [],
    migrations: [__dirname + '/../utils/migrations/*.{ts,js}'],
});
