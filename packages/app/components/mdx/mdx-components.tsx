import type { ComponentPropsWithoutRef } from "react";

import { CodeBlock } from "@/components/code-block";
import { ExampleTabs } from "@/components/example-tabs";
import { Callout } from "@/components/mdx/callout";

export const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-12 scroll-m-20 border-b-[3px] border-black pb-3 text-2xl font-black uppercase tracking-tight text-black" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-8 scroll-m-20 text-xl font-black uppercase tracking-tight text-black" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="leading-8 text-gray-700" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul className="space-y-2 pl-5 text-gray-700 marker:text-[#7a00ff]" {...props} />,
  ol: (props: ComponentPropsWithoutRef<"ol">) => <ol className="space-y-2 pl-5 text-gray-700 marker:text-[#7a00ff]" {...props} />,
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="font-bold text-[#7a00ff] underline decoration-black decoration-2 underline-offset-4 transition hover:text-[#6000d6]" {...props} />
  ),
  CodeBlock,
  ExampleTabs,
  Callout
};
