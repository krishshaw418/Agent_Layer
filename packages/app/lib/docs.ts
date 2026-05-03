import { readFile } from "fs/promises";
import path from "path";

export type DocMeta = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
};

const slugAliases: Record<string, string> = {
  "getting-started": "get-started",
  "node": "agent-layer-node"
};

function resolveDocSlug(slug: string) {
  return slugAliases[slug] ?? slug;
}

export const docSections: DocMeta[] = [
  {
    slug: "introduction",
    title: "Introduction",
    description: "Understand the Agent Layer network model and where the SDK fits into your stack.",
    eyebrow: "Overview"
  },
  {
    slug: "get-started",
    title: "Get Started",
    description: "Create an API key, fund your vault, and prepare your first SDK request.",
    eyebrow: "Quickstart"
  },
  {
    slug: "authentication",
    title: "Authentication",
    description: "How API keys work and how to keep them out of client-side bundles.",
    eyebrow: "Security"
  },
  {
    slug: "sdk-overview",
    title: "SDK Overview",
    description: "Review the resources exposed by the TypeScript SDK and the shape of the client.",
    eyebrow: "SDK"
  },
  {
    slug: "chat-api",
    title: "Chat API",
    description: "Create completions, stream tokens, and control routing with strategy hints.",
    eyebrow: "Core API"
  },
  {
    slug: "embeddings-api",
    title: "Embeddings API",
    description: "Generate embeddings for search, retrieval, ranking, and clustering workflows.",
    eyebrow: "Core API"
  },
  {
    slug: "account-api",
    title: "Account API",
    description: "Inspect your account balance and build operational visibility into your dashboard.",
    eyebrow: "Operations"
  },
  {
    slug: "token-estimation",
    title: "Token Estimation",
    description: "Estimate usage before execution to shape UX, quotas, and cost controls.",
    eyebrow: "Operations"
  },
  {
    slug: "error-handling",
    title: "Error Handling",
    description: "Handle transport, billing, and job execution failures without surprising users.",
    eyebrow: "Reliability"
  },
  {
    slug: "agent-layer-node",
    title: "Agent Layer Node",
    description: "Set up a node, provide credentials, and run the local server on Base.",
    eyebrow: "Node Setup"
  }
];

export async function getDocBySlug(slug = "introduction") {
  const resolvedSlug = resolveDocSlug(slug);
  const section = docSections.find((item) => item.slug === resolvedSlug);

  if (!section) {
    return null;
  }

  const filePath = path.join(process.cwd(), "content", "docs", `${resolvedSlug}.mdx`);
  const content = await readFile(filePath, "utf8");

  return {
    ...section,
    content
  };
}

export function getDocPagination(slug = "introduction") {
  const resolvedSlug = resolveDocSlug(slug);
  const index = docSections.findIndex((item) => item.slug === resolvedSlug);

  return {
    previous: index > 0 ? docSections[index - 1] : null,
    next: index < docSections.length - 1 ? docSections[index + 1] : null
  };
}

