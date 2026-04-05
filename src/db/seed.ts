import "dotenv/config";
import { db } from "./index.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { RoleType, StatusType } from "../types/types.js";

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";

  console.log(`Checking for existing admin user with email: ${email}...`);

  try {
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingAdmin) {
      console.log("Admin user already exists. Skipping seed.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name: "System Admin",
      email: email,
      password: hashedPassword,
      role: RoleType.admin,
      status: StatusType.active,
    });

    console.log("Admin user created successfully!");
    console.log(`Email: ${email}`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedAdmin();
