import type { ComponentPropsWithoutRef } from "react";

import { CodeBlock } from "@/components/code-block";
import { ExampleTabs } from "@/components/example-tabs";
import { Callout } from "@/components/mdx/callout";

export const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-12 scroll-m-20 text-2xl font-semibold text-white" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-8 scroll-m-20 text-xl font-semibold text-white" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="leading-8 text-slate-300" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul className="space-y-2 text-slate-300" {...props} />,
  ol: (props: ComponentPropsWithoutRef<"ol">) => <ol className="space-y-2 text-slate-300" {...props} />,
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="text-cyan-300 transition hover:text-cyan-200" {...props} />
  ),
  CodeBlock,
  ExampleTabs,
  Callout
};
