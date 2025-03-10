import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import { validateUser } from "./auth-utils";
import { UserRole } from "@prisma/client";

// Define user type to fix TypeScript errors
interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") || 
                            nextUrl.pathname.startsWith("/my-info") ||
                            nextUrl.pathname.startsWith("/support") ||
                            nextUrl.pathname.startsWith("/billing") ||
                            nextUrl.pathname.startsWith("/files");
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      // Type assertion to handle the user object
      if (user) {
        const typedUser = user as unknown as User;
        token.id = typedUser.id;
        token.email = typedUser.email;
        token.name = typedUser.name;
        token.role = typedUser.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Validate against our database
          const user = await validateUser(credentials.email as string, credentials.password as string);
          
          if (!user) {
            return null;
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Error validating user:", error);
          return null;
        }
      },
    }),
  ],
};

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" }
}); 