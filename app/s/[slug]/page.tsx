import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSite } from "@/lib/kv";
import { extractMetadataFromMarkdown } from "@/lib/seo";
import Markdown from "@/components/Markdown";

type SitePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: SitePageProps
): Promise<Metadata> {
  const { slug } = await props.params;
  const site = await getSite(slug);

  if (!site) {
    return {
      title: "Site Not Found",
    };
  }

  const pageTitle = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const { description: extractedDescription } = extractMetadataFromMarkdown(
    site.markdown
  );
  const pageDescription = extractedDescription || `View ${slug} on bxsite`;

  let siteUrl: string;
  if (site.customDomain && site.domainVerified) {
    siteUrl = `https://${site.customDomain}`;
  } else {
    const baseUrl = process.env.NEXTAUTH_URL || "https://bxsite.com";
    siteUrl = baseUrl.includes("localhost")
      ? `${baseUrl}/s/${slug}`
      : `https://${slug}.bxsite.com`;
  }

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: siteUrl,
      type: "website",
      siteName: "bxsite",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    alternates: {
      canonical: siteUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function SitePage(props: SitePageProps) {
  const { slug } = await props.params;
  const site = await getSite(slug);
  if (!site) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-slate-950 py-16 text-slate-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 font-mono overflow-x-hidden">
        <div className="prose prose-invert max-w-none break-words overflow-x-hidden">
          <Markdown>{site.markdown}</Markdown>
        </div>
      </div>
    </main>
  );
}
