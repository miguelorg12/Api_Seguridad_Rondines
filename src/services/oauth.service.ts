import { OauthClientService } from "@services/oauth_client.service";

export class OauthService {
  private oauthClientService: OauthClientService;

  constructor() {
    this.oauthClientService = new OauthClientService();
  }

  async authorize(query: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope?: string;
    state?: string;
    code_challenge: string;
    code_challenge_method: string;
  }) {
    const {
      response_type,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
    } = query;
    if (response_type !== "code") {
      throw new Error("Unsupported response_type");
    }
    const client = await this.oauthClientService.findOneByClientId(client_id);

    if (!client) {
      throw new Error("Client not found");
    }

    if (client.redirectUri !== redirect_uri) {
      throw new Error("Invalid redirect URI");
    }

    if (!code_challenge || !code_challenge_method) {
      throw new Error("Code challenge and method are required");
    }

    return {
      clientName: client.name,
      redirectUri: client.redirectUri,
      clientId: client.clientId,
    };
  }
}
