import { db } from "./index";
import { products, categories, brands, partnerApplications } from "./schema";

async function clearData() {
  console.log("Starting data wipe...");
  try {
    console.log("Clearing products...");
    await db.delete(products);

    console.log("Clearing categories...");
    await db.delete(categories);

    console.log("Clearing brands...");
    await db.delete(brands);

    console.log("Clearing partner applications...");
    await db.delete(partnerApplications);

    console.log("Data wiped successfully! Your store is now empty.");
    process.exit(0);
  } catch (error) {
    console.error("Error wiping data:", error);
    process.exit(1);
  }
}

clearData();
