import { redirect } from 'next/navigation';

type VerifyEmailPageProps = {
  params: Promise<{ id: string; hash: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { id, hash } = await params;
  const query = await searchParams;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') search.set(key, value);
  }

  redirect(`/api/v1/auth/email/verify/${id}/${hash}?${search.toString()}`);
}
