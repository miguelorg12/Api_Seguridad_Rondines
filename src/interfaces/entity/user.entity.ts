import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Oauth_Auth_Codes } from "./oauth_auth_codes.entity";
import { Oauth_Acceess_Tokens } from "./oauth_access_tokens.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column()
  curp: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  roleId: number;

  @Column()
  active: boolean;

  @Column()
  biometric: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Oauth_Auth_Codes, (ouath_auth_codes) => ouath_auth_codes.user)
  oauthAuthCodes: Oauth_Auth_Codes[];

  @OneToMany(() => Oauth_Acceess_Tokens, (oauth_access_tokens) => oauth_access_tokens.user)
  oauthAccessTokens: Oauth_Acceess_Tokens[];
}