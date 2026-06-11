import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers";
import { db } from "@/db";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "./email";
 
// Google Cloud & Firebase Identity Configuration
export const auth = betterAuth({
  appName: "FashionFynds - Powered by Google",
	baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url, token }, request) => {
			void sendPasswordResetEmail(user.email, user.name, url);
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }, request) => {
			void sendVerificationEmail(user.email, user.name, url);
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					if (user?.email && user?.name) {
						void sendWelcomeEmail(user.email, user.name);
					}
				},
			},
		},
	},
	socialProviders: {
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			},
		} : {}),
		...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? {
			facebook: {
				clientId: process.env.FACEBOOK_CLIENT_ID,
				clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
			},
		} : {}),
	},
	plugins: [bearer(), admin()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}