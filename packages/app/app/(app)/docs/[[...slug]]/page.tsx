import type { ReactNode } from "react";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

import { mdxComponents } from "@/components/mdx/mdx-components";
import { Button } from "@/components/ui/button";
import { docSections, getDocBySlug, getDocPagination } from "@/lib/docs";

export default async function DocsPage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolved = await params;
  const requestedSlug = resolved.slug?.[0] ?? "introduction";
  const doc = await getDocBySlug(requestedSlug);

  if (!doc) {
    notFound();
  }

  const { previous, next } = getDocPagination(requestedSlug);
  const activeSlug = doc.slug;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="grid gap-6 lg:items-stretch">
        <div className="border-[3px] border-black bg-white p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <div className="inline-flex border-[2px] border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
            {doc.eyebrow}
          </div>
          <h1 className="mt-5 text-4xl font-black uppercase leading-none tracking-tight text-black sm:text-5xl">
            {doc.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-gray-700">
            {doc.description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <QuickStep title="Connect wallet" description="Authenticate before creating keys or using the app." />
            <QuickStep title="Create API key" description="Generate a key for your app, service, or node runner." />
            <QuickStep title="Fund the vault" description="Top up once before making SDK requests." />
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <article className="border-[3px] border-black bg-white p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:p-8">
          <div className="prose-docs">
            <MDXRemote source={doc.content} components={mdxComponents} />
          </div>
        </article>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
        <PagerCard direction="Previous" doc={previous} icon={<ArrowLeft className="h-4 w-4" />} />
        <PagerCard direction="Next" doc={next} icon={<ArrowRight className="h-4 w-4" />} align="right" />
      </div>
    </div>
  );
}

function QuickStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-[3px] border-black bg-[#f7f7f7] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-sm font-black uppercase tracking-wider text-black">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-gray-700">{description}</p>
    </div>
  );
}

function PagerCard({
  direction,
  doc,
  icon,
  align = "left"
}: {
  direction: string;
  doc: { slug: string; title: string; description: string } | null;
  icon: ReactNode;
  align?: "left" | "right";
}) {
  if (!doc) {
    return <div />;
  }

  const href = doc.slug === "introduction" ? "/docs" : `/docs/${doc.slug}`;

  return (
    <div className={`border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${align === "right" ? "text-right" : ""}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a00ff]">{direction}</p>
      <p className="mt-2 text-lg font-black uppercase text-black">{doc.title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-gray-700">{doc.description}</p>
      <Button asChild className="mt-4 rounded-none border-[2px] border-black bg-black text-xs font-black uppercase text-white hover:bg-[#7a00ff]">
        <Link href={href} className="inline-flex items-center gap-2">
          {align === "left" ? icon : null}
          Open section
          {align === "right" ? icon : null}
        </Link>
      </Button>
    </div>
  );
}
