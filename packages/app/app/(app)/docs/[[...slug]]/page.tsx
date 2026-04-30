import type { ReactNode } from "react";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

import { mdxComponents } from "@/components/mdx/mdx-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { docSections, getDocBySlug, getDocPagination } from "@/lib/docs";

export default async function DocsPage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolved = await params;
  const slug = resolved.slug?.[0] ?? "introduction";
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const { previous, next } = getDocPagination(slug);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <Badge>{doc.eyebrow}</Badge>
            <h1 className="font-[var(--font-display)] text-4xl font-semibold text-white">{doc.title}</h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-300">{doc.description}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Docs shell</CardTitle>
              <CardDescription>
                MDX content, reusable code blocks, and example tabs keep the reference material consistent across the platform.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <article className="prose-docs">
          <MDXRemote source={doc.content} components={mdxComponents} />
        </article>
        <div className="grid gap-4 sm:grid-cols-2">
          <PagerCard direction="Previous" doc={previous} icon={<ArrowLeft className="h-4 w-4" />} />
          <PagerCard direction="Next" doc={next} icon={<ArrowRight className="h-4 w-4" />} align="right" />
        </div>
      </div>
      <aside className="hidden xl:block">
        <div className="sticky top-24 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation map</CardTitle>
              <CardDescription>Jump between core concepts and SDK references.</CardDescription>
            </CardHeader>
            <div className="space-y-1 px-6 pb-6">
              {docSections.map((section) => {
                const href = section.slug === "introduction" ? "/docs" : `/docs/${section.slug}`;
                const active = section.slug === slug;

                return (
                  <Link
                    key={section.slug}
                    href={href}
                    className={`block rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "bg-cyan-400/12 text-cyan-100"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    }`}
                  >
                    {section.title}
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </aside>
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
    <Card>
      <CardHeader className={align === "right" ? "items-end text-right" : undefined}>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{direction}</p>
        <CardTitle>{doc.title}</CardTitle>
        <CardDescription>{doc.description}</CardDescription>
        <Button asChild variant="ghost" size="sm" className="px-0">
          <Link href={href} className="inline-flex items-center gap-2">
            {align === "left" ? icon : null}
            Open section
            {align === "right" ? icon : null}
          </Link>
        </Button>
      </CardHeader>
    </Card>
  );
}
