'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { ProductForm } from '@/components/dashboard/ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const res = await api.get(`/merchant/products/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <ProductForm initialData={product} isEdit productId={id} />;
}
