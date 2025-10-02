// types/next-auth.d.ts
import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      contactNo: string | null;
      role: UserRole;
      image: string | null;
      isOAuth: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNo: string | null;
    role: UserRole;
    image: string | null;
    emailVerified: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNo: string | null;
    role: UserRole;
    image: string | null;
    isOAuth: boolean;
  }
}