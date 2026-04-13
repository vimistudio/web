import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Shared layout for legal pages (privacy, terms). Plain typography, no animation,
 * professional and scannable. Renders inside the marketing Template so it picks
 * up the site header automatically.
 */
export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-white pt-32 pb-24 px-6">
      <article className="max-w-2xl mx-auto">
        <header className="mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Last updated {lastUpdated}
          </p>
        </header>

        <div className="prose prose-gray max-w-none [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:my-4 [&_ul]:my-4 [&_ul]:pl-6 [&_li]:my-1.5 [&_li]:text-gray-700 [&_a]:text-[#909af7] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#7d87e8] [&_strong]:font-medium [&_strong]:text-gray-900">
          {children}
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500">
          Questions? Email{" "}
          <a
            href="mailto:hello@vimistudio.com"
            className="text-[#909af7] underline underline-offset-2"
          >
            hello@vimistudio.com
          </a>
          .
        </footer>
      </article>
    </main>
  );
}
