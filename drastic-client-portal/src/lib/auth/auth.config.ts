import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";

export const authConfig: NextAuthConfig = {
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
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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
        // TODO: Replace this with actual database authentication
        // For now, this is a dummy authentication
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // In a real application, you would look this up in a database
        if (credentials.email === "admin@drastic.digital" && credentials.password === "password") {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@drastic.digital",
            role: "admin",
          };
        }

        if (credentials.email === "client@example.com" && credentials.password === "password") {
          return {
            id: "2",
            name: "Client User",
            email: "client@example.com",
            role: "client",
          };
        }

        return null;
      },
    }),
  ],
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig); 