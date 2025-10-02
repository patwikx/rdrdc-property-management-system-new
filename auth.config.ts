// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { LoginSchema } from "@/lib/validations/login-schema";
import { prisma } from "@/lib/prisma";

async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        contactNo: true,
        role: true,
        image: true,
        emailVerified: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);
        
        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;
        const user = await getUserByEmail(email);
        
        if (!user || !user.password) {
          return null;
        }
        
        const passwordsMatch = await bcryptjs.compare(
          password,
          user.password
        );
       
        if (!passwordsMatch) {
          return null;
        }

        // Return user data matching your Prisma User model
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          contactNo: user.contactNo,
          role: user.role,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;