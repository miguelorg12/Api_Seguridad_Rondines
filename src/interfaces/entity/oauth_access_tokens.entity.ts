import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "@entities/user.entity";
import { Oauth_Clients } from "@entities/oauth_clients.entity";

@Entity()
export class Oauth_Acceess_Tokens {
    @PrimaryColumn('uuid')
    token: string;

    @Column({type:'text'})
    scopes: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({type:'boolean', default: false})
    revoked: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.oauthAccessTokens)
    user: User;

    @ManyToOne(() => Oauth_Clients, (client) => client.oauthAccessTokens)
    client: Oauth_Clients;
}