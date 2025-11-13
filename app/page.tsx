import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "bxsite",
};

export default function Home() {
  return <HomeInner />;
}

async function HomeInner() {
  return (
    <main className="min-h-screen bg-slate-950 py-16 text-slate-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 font-mono">
        <Header />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">
            the fastest and easiest way to build a website
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            you can have a <span className="text-sky-300">free</span> site just
            like this in minutes
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-200">how it works</h2>
          <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-slate-300">
            <li>create an account</li>
            <li>write your site content in markdown</li>
            <li>choose your domain name</li>
            <li>click deploy</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200">get started</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            <a
              href="/dashboard"
              className="text-sky-300 underline underline-offset-4"
            >
              Go to the dashboard
            </a>{" "}
            and create your first site.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-200">examples</h2>
          <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-slate-300">
            <li>
              <a
                href="https://markdowncheatsheet.bxsite.com/"
                className="text-sky-300 underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://markdowncheatsheet.bxsite.com
              </a>
            </li>
            <li>
              <a
                href="https://nhlstats.bxsite.com/"
                className="text-sky-300 underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://nhlstats.bxsite.com
              </a>
            </li>
            <li>
              <a
                href="https://news.bxsite.com/"
                className="text-sky-300 underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://news.bxsite.com
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <p>bxsite is fully open-source and free to use.</p>
          <p>
            <a
              href="https://github.com/JakeSlone/bxsite"
              className="text-sky-300 underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              source code
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
