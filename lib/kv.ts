import { kv } from "@vercel/kv";

export interface SiteRecord {
  slug: string;
  markdown: string;
  ownerUserId: string;
  updatedAt: number;
  customDomain?: string;
  domainVerificationToken?: string;
  domainVerified?: boolean;
}

export async function getSite(slug: string): Promise<SiteRecord | null> {
  const data = await kv.get<SiteRecord>(`site:${slug}`);
  return data ?? null;
}

export async function getSiteByDomain(domain: string): Promise<SiteRecord | null> {
  const normalizedDomain = domain.toLowerCase().trim();
  const slug = await kv.get<string>(`domain:${normalizedDomain}`);
  if (!slug) {
    return null;
  }
  return getSite(slug);
}

export async function setDomainMapping(domain: string, slug: string): Promise<void> {
  const normalizedDomain = domain.toLowerCase().trim();
  await kv.set(`domain:${normalizedDomain}`, slug);
}

export async function removeDomainMapping(domain: string): Promise<void> {
  const normalizedDomain = domain.toLowerCase().trim();
  await kv.del(`domain:${normalizedDomain}`);
}

export async function listSitesByUser(userId: string): Promise<string[]> {
  const slugs = (await kv.smembers(`sites:byUser:${userId}`)) as
    | string[]
    | null;
  return slugs ?? [];
}

export { kv };
