import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (existingUser) {
    return existingUser;
  }

  // User is authenticated via Clerk but doesn't exist in DB yet.
  // Auto-create them using Clerk session data (covers first login
  // and acts as a fallback if the webhook was missed).
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unable to retrieve user data");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const [newUser] = await db
    .insert(users)
    .values({ clerkId, email, name })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, name, updatedAt: new Date() },
    })
    .returning();

  return newUser;
}
