import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1752442087690 implements MigrationInterface {
    name = 'Init1752442087690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "oauth_acceess_tokens" (
                "token" uuid NOT NULL,
                "scopes" text NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" integer,
                "clientId" integer,
                CONSTRAINT "PK_da4c9bdafbb35ec0395e2c0edff" PRIMARY KEY ("token")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "oauth_clients" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "clientId" character varying NOT NULL,
                "clientSecret" character varying,
                "redirectUri" text NOT NULL,
                "grantTypes" character varying NOT NULL,
                "scopes" text NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_b0c094fe1ef0a6c4af8f2b10be7" UNIQUE ("clientId"),
                CONSTRAINT "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "oauth_auth_codes" (
                "code" uuid NOT NULL,
                "redirectUri" text NOT NULL,
                "scopes" text NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE,
                "codeChallenge" character varying NOT NULL,
                "codeChallengeMethod" character varying(20) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" integer,
                "clientId" integer,
                CONSTRAINT "PK_d40c87f888fba2e9fcaf77bef58" PRIMARY KEY ("code")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "curp" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "roleId" integer NOT NULL,
                "active" boolean NOT NULL,
                "biometric" character varying NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_acceess_tokens"
            ADD CONSTRAINT "FK_d43065af4bda0087eff71b6aa9d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_acceess_tokens"
            ADD CONSTRAINT "FK_c2bb00d8b5d775127d9846cda46" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_auth_codes"
            ADD CONSTRAINT "FK_22541b7182ffa065fcd07e58c82" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_auth_codes"
            ADD CONSTRAINT "FK_7e3edc468b1eb03a1b4d16d38c5" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "oauth_auth_codes" DROP CONSTRAINT "FK_7e3edc468b1eb03a1b4d16d38c5"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_auth_codes" DROP CONSTRAINT "FK_22541b7182ffa065fcd07e58c82"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_acceess_tokens" DROP CONSTRAINT "FK_c2bb00d8b5d775127d9846cda46"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_acceess_tokens" DROP CONSTRAINT "FK_d43065af4bda0087eff71b6aa9d"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
        await queryRunner.query(`
            DROP TABLE "oauth_auth_codes"
        `);
        await queryRunner.query(`
            DROP TABLE "oauth_clients"
        `);
        await queryRunner.query(`
            DROP TABLE "oauth_acceess_tokens"
        `);
    }

}
