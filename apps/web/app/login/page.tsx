import Link from 'next/link';
import { MagicLinkForm } from './magic-link-form';
import { Card } from '../../components/ui/card';

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
    <main className="mx-auto mt-20 max-w-md space-y-4">
      <Card className="space-y-4">
        <h1>Sign in</h1>
        <p className="text-sm text-muted-foreground">Use an email magic link to access your Kokoro Presence account.</p>
        <MagicLinkForm />
        {sent ? <p className="text-sm text-emerald-700">Check your inbox for a login link.</p> : null}
        {error ? <p className="text-sm text-red-700">Unable to sign in right now: {error}</p> : null}
        <p className="text-sm">
          <Link href="/" className="text-primary hover:underline">
            Back home
          </Link>
        </p>
      </Card>
    </main>
  );
}
