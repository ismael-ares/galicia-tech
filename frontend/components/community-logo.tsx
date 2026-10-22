'use client';
import { useState } from 'react';
import { Globe2 } from 'lucide-react';
import { communityLogo } from '@/lib/community-logo';

export function CommunityLogo({identity, size=24}: {identity:string; size?:number}) {
 const asset=communityLogo(identity);
 const [failed,setFailed]=useState<string|null>(null);
 return asset && failed!==asset
  ? <img src={'/assets/source-logos/'+asset} width={size} height={size} alt="" onError={()=>setFailed(asset)} />
  : <Globe2 size={size} aria-hidden="true"/>;
}
