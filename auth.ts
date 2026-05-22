import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import type { Role } from "@/lib/rbac";
import { getServerSession } from "next-auth/next";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { username: parsed.data.username }
          });
        } catch (e) {
          console.error("[auth] DB error during login:", e);
          throw new Error("Database unavailable. Please try again.");
        }

        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.username,
          username: user.username,
          role: user.role as Role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.username = user.username;
        token.name = user.username;
        token.role = user.role as Role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId && token.role) {
        session.user.id = token.userId;
        session.user.name = token.name ?? token.username ?? session.user.name ?? "";
        session.user.username = token.username ?? token.name ?? session.user.name ?? "";
        session.user.role = token.role;
      }

      return session;
    }
  }
};

export function auth() {
  return getServerSession(authOptions);
}

export default NextAuth(authOptions);