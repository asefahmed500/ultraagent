import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations";
import { ensureSeedData } from "@/lib/seed";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);
          await ensureSeedData();
          await connectDB();
          const user = await User.findOne({ email: email.toLowerCase() });
          if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return null;
          }
          return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            workspaceId: user.workspaceId,
            autonomyLevel: user.autonomyLevel,
            image: user.image ?? undefined,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = ((user as { role?: string }).role ?? "member") as never;
        token.workspaceId = (user as { workspaceId?: string }).workspaceId ?? "";
        token.autonomyLevel = ((user as { autonomyLevel?: string }).autonomyLevel ??
          "L1") as never;
      }
      if (trigger === "update" && session) {
        const update = session as Record<string, unknown>;
        if (update.name) token.name = update.name as string;
        if (update.autonomyLevel) token.autonomyLevel = update.autonomyLevel as never;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as never;
        session.user.workspaceId = token.workspaceId as string;
        session.user.autonomyLevel = token.autonomyLevel as never;
      }
      return session;
    },
  },
});
