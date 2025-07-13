import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { User } from "@entities/user.entity";
import { Oauth_Clients } from "@entities/oauth_clients.entity";

@Entity()
export class Oauth_Auth_Codes {
    @PrimaryColumn('uuid')
    code: string;
    
    @Column({type:'text'})
    redirectUri: string;

    @Column({type:'text'})
    scopes: string;

    @Column({ type: 'timestamptz', nullable: true })
    expiresAt: Date;
    
    @Column()
    codeChallenge: string; 

    @Column({length:20})
    codeChallengeMethod: string;

    @CreateDateColumn({ type: 'timestamptz'})
    createdAt: Date;

    @ManyToOne(()=> User, (user) => user.oauthAuthCodes)
    user: User;

    @ManyToOne(() => Oauth_Clients, (client) => client.oauthAuthCodes)
    client: Oauth_Clients;

}