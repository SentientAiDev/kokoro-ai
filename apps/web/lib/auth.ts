import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';

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

export function getAuthSession() {
  return getServerSession(authOptions);
}
