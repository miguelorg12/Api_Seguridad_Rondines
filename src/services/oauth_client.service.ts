import { AppDataSource } from "../configs/data-source";
import { Oauth_Clients } from "@entities/oauth_clients.entity";
import { Repository } from "typeorm";

export class OauthClientService {
  private oauthClientRepository: Repository<Oauth_Clients>;
  constructor() {
    this.oauthClientRepository = AppDataSource.getRepository(Oauth_Clients);
  }

  async findAll(): Promise<Oauth_Clients[]> {
    return await this.oauthClientRepository.find();
  }

  async findOne(id: number): Promise<Oauth_Clients | null> {
    return await this.oauthClientRepository.findOne({ where: { id } });
  }

  async findOneByClientId(clientId: string): Promise<Oauth_Clients | null> {
    return await this.oauthClientRepository.findOne({ where: { clientId: clientId } });
  }

  async delete(id: number): Promise<void> {
    await this.oauthClientRepository.delete(id);
  }
}
