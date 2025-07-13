import { AppDataSource } from "@configs/data-source";
import { User } from "@entities/user.entity";
import bcrypt from "bcrypt";

export async function seedUsers() {
  const userRepository = AppDataSource.getRepository(User);

  const user = userRepository.create({
    name: "Admin",
    lastName: "Principal",
    curp: "XEXX010101HNEXXXA0",
    email: "admin@demo.com",
    password: await bcrypt.hash("admin123", 10),
    roleId: 1,
    active: true,
    biometric: "",
  });

  await userRepository.save(user);
  console.log("User seeded successfully");
}