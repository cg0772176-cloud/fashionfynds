import { db } from "./index";
import { user } from "./schema";
import { eq } from "drizzle-orm";

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("Please provide an email address. Example: npm run db:admin your@email.com");
    process.exit(1);
  }

  try {
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
    if (existingUser.length === 0) {
      console.error(`User with email ${email} not found! Please sign up first.`);
      process.exit(1);
    }

    await db.update(user).set({ role: "admin" }).where(eq(user.id, existingUser[0].id));
    console.log(`Success! ${email} is now an admin.`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating user:", error);
    process.exit(1);
  }
}

makeAdmin();
