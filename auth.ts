// auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import { AuditAction, EntityType, UserRole } from "@prisma/client"

type ActivityMetadata = {
  provider?: string;
  status?: string;
  reason?: string;
  [key: string]: string | number | boolean | null | undefined;
};

async function logUserActivity(
  userId: string,
  action: AuditAction,
  ipAddress?: string,
  userAgent?: string,
  metadata?: ActivityMetadata
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        entityId: userId,
        entityType: EntityType.USER,
        action,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log user activity:", error);
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaAdapter type mismatch with NextAuth v5
  adapter: PrismaAdapter(prisma) as any,
  session: { 
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
    signOut: "/"
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await logUserActivity(user.id, AuditAction.LOGIN);
      }
    },
    async signOut(message) {
      // Extract userId from either token or session
      const userId = 'token' in message ? message.token?.sub : message.session?.userId;
      if (userId) {
        await logUserActivity(userId, AuditAction.LOGOUT);
      }
    },
  },
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id) return false;
      
      // Allow OAuth without additional checks
      if (account?.provider !== "credentials") {
        // Check if user exists, if not create with custom fields
        const existingUser = await prisma.user.findUnique({ 
          where: { email: user.email! },
        });
        
        if (!existingUser) {
          // Create user with custom fields for OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              emailVerified: user.emailVerified,
              image: user.image,
              firstName: user.name?.split(' ')[0] || 'User',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              password: '', // OAuth users don't need passwords
              contactNo: null,
              role: UserRole.VIEWER, // Default role for OAuth users
            },
          });
        }
        
        await logUserActivity(
          user.id,
          AuditAction.LOGIN,
          undefined,
          undefined,
          { provider: account?.provider }
        );
        return true;
      }
      
      // For credentials, check if user exists
      const existingUser = await prisma.user.findUnique({ 
        where: { id: user.id },
        select: {
          id: true,
          emailVerified: true,
        }
      });
      
      if (!existingUser) {
        await logUserActivity(
          user.id,
          AuditAction.LOGIN,
          undefined,
          undefined,
          { status: "failed", reason: "user_not_found" }
        );
        return false;
      }

      // Optional: Uncomment the lines below if you want to require email verification
      // if (!existingUser.emailVerified) {
      //   await logUserActivity(
      //     user.id,
      //     AuditAction.LOGIN,
      //     undefined,
      //     undefined,
      //     { status: "failed", reason: "email_not_verified" }
      //   );
      //   return false;
      // }

      await logUserActivity(user.id, AuditAction.LOGIN);
      return true;
    },
    
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
        token.role = user.role;
        token.contactNo = user.contactNo;
        token.image = user.image;
        token.isOAuth = !!account;
      }

      // Subsequent requests - refresh user data
      if (!token.sub) return token;
      
      const userWithDetails = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          contactNo: true,
          role: true,
          image: true,
          emailVerified: true,
        },
      });
      
      if (!userWithDetails) return token;

      // Update token data
      token.id = userWithDetails.id;
      token.firstName = userWithDetails.firstName;
      token.lastName = userWithDetails.lastName;
      token.email = userWithDetails.email;
      token.contactNo = userWithDetails.contactNo;
      token.role = userWithDetails.role;
      token.image = userWithDetails.image;
     
      return token;
    },
    
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.email = token.email as string;
        session.user.contactNo = token.contactNo as string | null;
        session.user.role = token.role as UserRole;
        session.user.image = token.image as string | null;
        session.user.isOAuth = token.isOAuth as boolean;
      }
      return session;
    },
  },
});