import Link from 'next/link';
import { MagicLinkForm } from './magic-link-form';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const sent = getParamValue(params.sent) === 'true';
  const error = getParamValue(params.error);

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 560 }}>
      <h1>Sign in</h1>
      <p>Use an email magic link to access your Kokoro Presence account.</p>
      <MagicLinkForm />
      {sent ? <p>Check your inbox for a login link.</p> : null}
      {error ? <p>Unable to sign in right now: {error}</p> : null}
      <p>
        <Link href="/">Back home</Link>
      </p>
    </main>
  );
}
