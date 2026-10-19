'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SellerInboxThreadRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/inbox?id=${encodeURIComponent(id)}`);
  }, [id, router]);

  return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#111111]" /></div>;
}
