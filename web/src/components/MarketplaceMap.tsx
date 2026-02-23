'use client';

import dynamic from 'next/dynamic';
import type { Business } from '@/lib/api';

const MarketplaceMapInner = dynamic(() => import('./MarketplaceMapInner'), { ssr: false });

type Props = { businesses: Business[]; centerOn?: [number, number] | null };

export default function MarketplaceMap({ businesses, centerOn }: Props) {
  return (
    <div className="h-full w-full min-h-[300px]">
      <MarketplaceMapInner businesses={businesses} centerOn={centerOn ?? null} />
    </div>
  );
}
