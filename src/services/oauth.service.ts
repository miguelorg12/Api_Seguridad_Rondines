import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "@configs/data-source";
import { randomBytes } from "crypto";
import { User } from "@interfaces/entity/user.entity";
import { OauthClientsEntity } from "@interfaces/entity/oauth_clients.entity";
import { OauthAccessTokensEntity } from "@interfaces/entity/oauth_access_tokens.entity";
import { OauthAuthorizationCodesEntity } from "@interfaces/entity/oauth_authorization_codes.entity";
import { OauthRefreshTokensEntity } from "@interfaces/entity/oauth_refresh_tokens.entity";
import { Repository } from "typeorm";

const JWT_SECRET = process.env.JWT_SECRET;

export class OauthService {
  private userRepository: Repository<User>;
  private clientRepository: Repository<OauthClientsEntity>;
  private authorizationCodeRepository: Repository<OauthAuthorizationCodesEntity>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.clientRepository = AppDataSource.getRepository(OauthClientsEntity);
    this.authorizationCodeRepository = AppDataSource.getRepository(
      OauthAuthorizationCodesEntity
    );
  }

  async validateAuthorizationRequest(
    client_id: string,
    redirect_uri: string,
    response_type: string,
    code_challenge: string,
    code_challenge_method: string
  ) {
    if (response_type !== "code") {
      throw new Error("Invalid response type");
    }
    if (code_challenge && !code_challenge_method) {
      throw new Error(
        "Code challenge method is required when code challenge is provided"
      );
    }

    const client = await this.clientRepository.findOne({
      where: { client_id },
    });
    if (!client) {
      throw new Error("Client not found");
    }

    if (client.redirect_uri && client.redirect_uri !== redirect_uri) {
      throw new Error("Invalid redirect URI");
    }

    return client;
  }

  async generateAuthorizationCode(
    user_id: number,
    client_id: string,
    code_challenge: string,
    code_challenge_method: string
  ) {
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const client = await this.clientRepository.findOne({
      where: { client_id },
    });

    if (!user) throw new Error("User not found");
    if (!client) throw new Error("Client not found");

    const authCode = this.authorizationCodeRepository.create({
      client,
      user,
      expires_at,
      code_challenge,
      code_challenge_method,
    });
    const saved = await this.authorizationCodeRepository.save(authCode);
    return saved.code;
  }

  async loginUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new Error("Credenciales invalidas");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Credenciales invalidas");
    }
    return user;
  }
}
