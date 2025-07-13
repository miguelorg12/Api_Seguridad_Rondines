import { AppDataSource } from "../configs/data-source";
import { User } from "@entities/user.entity";
import { CreateUserDto } from "@dto/create-user.dto";
import { Repository } from "typeorm";

export class UserService {
  private userRepositry: Repository<User>;

  constructor() {
    this.userRepositry = AppDataSource.getRepository(User);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepositry.create(createUserDto);
    return await this.userRepositry.save(user);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepositry.findOne({ where: { email } });
  }
}
