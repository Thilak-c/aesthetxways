'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WebsiteAddProduct() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/website/products?action=new');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center p-6 text-neutral-500">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Opening Product Creator...</span>
      </div>
    </div>
  );
}
