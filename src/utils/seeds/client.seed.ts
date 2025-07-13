import { AppDataSource } from "@configs/data-source";
import { Oauth_Clients } from "@entities/oauth_clients.entity";
import bcrypt from "bcrypt";

export async function seedClients() {
  const clientRepository = AppDataSource.getRepository(Oauth_Clients);

  const exists = await clientRepository.findOne({
    where: { clientId: "my-app-client" },
  });
  if (exists) {
    console.log("Client already exists");
    return;
  }

  const client = clientRepository.create({
    // Asegúrate de que 'name' exista en la entidad Oauth_Clients, si no, elimínalo
    name: "My App Client",
    clientId: "my-app-client",
    clientSecret: await bcrypt.hash("supersecret",10), // hashing correcto
    redirectUri: "http://localhost:3000/callback",
    grantTypes: "authorization_code,client_credentials",
    scopes: "read,write",
  });

  await clientRepository.save(client);
  console.log("Client seeded successfully");
}
