import {
  Activity,
  BadgeDollarSign,
  Binary,
  BookOpen,
  Brain,
  Cable,
  Gauge,
  Home,
  Layers3,
  Network,
  PlaySquare,
  Router,
  ServerCog
} from "lucide-react";

export const siteConfig = {
  name: "Agent Layer",
  description: "Decentralized AI Infrastructure"
};

export const mainNav = [
  { title: "Home", href: "/", icon: Home },
  { title: "Docs", href: "/docs", icon: BookOpen },
  { title: "Playground", href: "/playground", icon: PlaySquare },
  { title: "About", href: "/about", icon: Layers3 },
  { title: "Run a Node", href: "/node", icon: ServerCog }
];

export const docsNav = [
  { slug: "introduction", title: "Introduction" },
  { slug: "get-started", title: "Get Started" },
  { slug: "authentication", title: "Authentication" },
  { slug: "sdk-overview", title: "SDK Overview" },
  { slug: "chat-api", title: "Chat API" },
  { slug: "embeddings-api", title: "Embeddings API" },
  { slug: "account-api", title: "Account API" },
  { slug: "token-estimation", title: "Token Estimation" },
  { slug: "error-handling", title: "Error Handling" }
];

export const featureCards = [
  {
    title: "Decentralized Compute",
    description: "Route workloads across distributed nodes instead of a single centralized provider.",
    icon: Network
  },
  {
    title: "Cost-Efficient AI",
    description: "Strategy-aware routing helps balance lower-cost execution against lower-latency paths.",
    icon: BadgeDollarSign
  },
  {
    title: "Streaming Responses",
    description: "Open WebSocket streams for real-time completions and progressive UX in your product.",
    icon: Activity
  },
  {
    title: "Token-Based Billing",
    description: "Vault + Escrow flows make usage, balances, and settlement explicit at the network layer.",
    icon: Gauge
  }
];

export const architectureSteps = [
  {
    title: "Request In",
    description: "Apps send chat or embeddings jobs into Agent Layer using a single SDK.",
    icon: Brain
  },
  {
    title: "Network Routing",
    description: "The scheduler chooses nodes based on strategy, availability, and pricing signals.",
    icon: Router
  },
  {
    title: "Execution",
    description: "Distributed nodes execute the workload and stream progress or final outputs back.",
    icon: Cable
  },
  {
    title: "Settlement",
    description: "Vault and Escrow coordinate token movement once the job is delivered.",
    icon: Binary
  }
];

export const modelOptions = [
  { value: "agent-gpt-fast", label: "agent-gpt-fast" },
  { value: "agent-gpt-pro", label: "agent-gpt-pro" },
  { value: "agent-embed-1", label: "agent-embed-1" }
];

