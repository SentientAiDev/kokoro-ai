import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';

type AuthDb = {
  user: {
    findUnique(args: {
      where: { email: string };
      select: { id: true; email: true; name: true };
    }): Promise<{ id: string; email: string; name: string | null } | null>;
  };
};

const db = prisma as unknown as AuthDb;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login?sent=true',
  },

  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  if (process.env.TEST_AUTH_EMAIL) {
    const user = await db.user.findUnique({
      where: { email: process.env.TEST_AUTH_EMAIL },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }
  }

  return getServerSession(authOptions);
}
