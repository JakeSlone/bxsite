import { kv } from "@vercel/kv";

export interface SiteRecord {
  slug: string;
  markdown: string;
  ownerUserId: string;
  updatedAt: number;
}

export async function getSite(slug: string): Promise<SiteRecord | null> {
  const data = await kv.get<SiteRecord>(`site:${slug}`);
  return data ?? null;
}

export async function listSitesByUser(userId: string): Promise<string[]> {
  const slugs = (await kv.smembers(`sites:byUser:${userId}`)) as
    | string[]
    | null;
  return slugs ?? [];
}

export { kv };
