import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';
import { DEV_AUTH_BYPASS, EMAIL_AUTH_ENABLED } from './env';

const isDevCredentialsEnabled = process.env.NODE_ENV === 'development' || DEV_AUTH_BYPASS;

type AuthDb = {
  user: {
    upsert(args: {
      where: { email: string };
      create: { email: string; isGuest: false };
      update: { isGuest: false };
      select: { id: true; email: true; name: true };
    }): Promise<{ id: string; email: string | null; name: string | null }>;
  };
};

const db = prisma as unknown as AuthDb;


const providers: NextAuthOptions['providers'] = [];

if (EMAIL_AUTH_ENABLED) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

if (isDevCredentialsEnabled) {
  providers.push(
    CredentialsProvider({
      id: 'dev-credentials',
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();

        if (!email) {
          return null;
        }

        const user = await db.user.upsert({
          where: { email },
          create: { email, isGuest: false },
          update: { isGuest: false },
          select: { id: true, email: true, name: true },
        });

        return user;
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
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
  return getServerSession(authOptions);
}

export function canSignInWithEmail() {
  return EMAIL_AUTH_ENABLED;
}

export function canUseDevCredentials() {
  return isDevCredentialsEnabled;
}
