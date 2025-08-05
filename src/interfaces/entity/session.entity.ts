import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("session")
export class Session {
  @PrimaryColumn({ type: "varchar", collation: "default" })
  sid: string;

  @Column({ type: "json" })
  sess: any;

  @Column({ type: "timestamp", precision: 6 })
  expire: Date;
}
