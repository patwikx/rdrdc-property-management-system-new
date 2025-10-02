"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { getUserByUsername } from "./auth-users";
import { LoginSchema } from "../validations/login-schema";
import { signIn } from "../../auth";


type LoginResult = {
  error?: string;
  success?: string;
};

export const login = async (
  values: z.infer<typeof LoginSchema>,
): Promise<LoginResult> => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  const existingUser = await getUserByUsername(email);

  if (!existingUser || !existingUser.password) {
    return { error: "User does not exist!" }
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid credentials!" };
    }

    return { success: "Logged in successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" }
        default:
          return { error: "Something went wrong!" }
      }
    }

    throw error;
  }
};

