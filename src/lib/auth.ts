import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Adapter } from "next-auth/adapters";
import { rateLimit } from "./rate-limit";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Same verified email as an existing credentials user links to that account.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const rl = rateLimit(`login:${email}`, 20, 15 * 60_000);
        if (!rl.ok) {
          throw new Error("Too many login attempts. Try again later.");
        }
        const user = await prisma.user.findUnique({ where: { email } });
        // OAuth-only users have null passwordHash — credentials login must fail cleanly.
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, plan: user.plan };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const planFromUser = (user as { plan?: string }).plan;
        if (planFromUser) {
          token.plan = planFromUser;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { plan: true, planStatus: true },
          });
          if (dbUser) {
            const active =
              dbUser.plan === "PRO" &&
              (!dbUser.planStatus ||
                dbUser.planStatus === "active" ||
                dbUser.planStatus === "trialing");
            token.plan = active ? "PRO" : "FREE";
          } else {
            token.plan = "FREE";
          }
        }
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true, planStatus: true },
        });
        if (dbUser) {
          const active =
            dbUser.plan === "PRO" &&
            (!dbUser.planStatus ||
              dbUser.planStatus === "active" ||
              dbUser.planStatus === "trialing");
          token.plan = active ? "PRO" : "FREE";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.plan = (token.plan as string) ?? "FREE";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};