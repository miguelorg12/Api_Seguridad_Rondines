import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "@configs/data-source";
import { randomBytes, createHash } from "crypto";
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
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  }

  async generateAccessToken(
    grant_type: string,
    code: string,
    redirect_uri: string,
    client_id: string,
    code_verifier: string
  ) {
    if (grant_type !== "code") {
      throw new Error("Invalid grant type");
    }

    const authCode = await this.authorizationCodeRepository.findOne({
      where: { code },
      relations: ["user", "client"],
    });

    if (!authCode) {
      throw new Error("Authorization code not found");
    }

    if (authCode.expires_at < new Date()) {
      throw new Error("Authorization code expired");
    }

    if (authCode.client.client_id !== client_id) {
      throw new Error("Client ID mismatch");
    }

    if (authCode.client.redirect_uri !== redirect_uri) {
      throw new Error("Redirect URI mismatch");
    }

    if (authCode.code_challenge_method === "S256" && !code_verifier) {
      throw new Error("Code verifier is required for S256 method");
    }
    let isCodeValid = true;
    if (authCode.code_challenge_method === "S256") {
      const hash = createHash("sha256")
        .update(code_verifier)
        .digest("base64url");
      isCodeValid = hash === authCode.code_challenge;
    }
    if (!isCodeValid) {
      throw new Error("Invalid code verifier");
    }
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const payload = {
      sub: authCode.user.id,
      client_id: authCode.client.client_id,
    };
    const expiresIn = 3600; // 1 hour
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn });

    return {
      accessToken,
      tojenType: "Bearer",
      expires_in: expiresIn,
    };
  }
}
