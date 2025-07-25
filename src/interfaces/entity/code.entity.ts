import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import bcrypt from "bcrypt";
import { User } from "@interfaces/entity/user.entity";

@Entity()
export class Code {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  code: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @Column({ type: "timestamptz" })
  expirates_at: Date;

  @BeforeInsert()
  setExpirationDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // Set expiration to 10 minutes from now
    this.expirates_at = now;
  }

  @ManyToOne(() => User, (user) => user.codes)
  @JoinColumn({ name: "user_id" })
  user: User;

  @BeforeInsert()
  async hashCode() {
    if (this.code) {
      this.code = await bcrypt.hash(this.code, 10);
    }
  }
}
