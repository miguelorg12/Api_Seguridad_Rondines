import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Oauth_Auth_Codes } from "@entities/oauth_auth_codes.entity";
import { Oauth_Acceess_Tokens } from "@entities/oauth_access_tokens.entity";

@Entity()
export class Oauth_Clients {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({unique: true})
    clientId: string;

    @Column({nullable: true})
    clientSecret: string;

    @Column({type:'text'})
    redirectUri: string;

    @Column()
    grantTypes: string;

    @Column({type:'text'})
    scopes: string;

    @CreateDateColumn({type:'timestamptz'})
    createdAt: Date;

    @UpdateDateColumn({type:'timestamptz'})
    updatedAt: Date;

    @OneToMany(() => Oauth_Auth_Codes, (oauth_auth_codes) => oauth_auth_codes.client)
    oauthAuthCodes: Oauth_Auth_Codes[];

    @OneToMany(() => Oauth_Acceess_Tokens, (oauth_access_tokens) => oauth_access_tokens.client)
    oauthAccessTokens: Oauth_Acceess_Tokens[];

}