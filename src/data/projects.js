export const PROJECTS = [
  {
    id: 1,
    title: "Nimbus SaaS",
    tagline: "Multi-tenant workspace platform",
    description:
      "A production-grade SaaS platform with team workspaces, role-based access, real-time collaboration, Stripe billing and a full admin console. Built for scale with clean separation between the API layer and the UI.",
    tech: ["React", "Tailwind", "NestJS", "PostgreSQL", "Redis", "Stripe"],
    highlights: [
      "Multi-tenant architecture with row-level security",
      "Real-time events via WebSockets",
      "99.9% uptime on a 3-node cluster",
    ],
    github: "#",
    demo: "#",
    image: "project-saas",
    accent: "from-indigo-500 via-violet-500 to-fuchsia-500",
  },
  {
    id: 2,
    title: "Atlas Agent",
    tagline: "Autonomous AI research agent",
    description:
      "An autonomous Python agent that plans, searches the web, reads documents and writes structured reports. Orchestrates multiple LLM calls with tool use, memory and self-reflection loops.",
    tech: ["Python", "LangChain", "OpenAI", "FastAPI", "ChromaDB", "Docker"],
    highlights: [
      "ReAct loop with tool-calling & memory",
      "Streaming responses over SSE",
      "Pluggable tool registry",
    ],
    github: "#",
    demo: "#",
    image: "project-ai",
    accent: "from-cyan-400 via-sky-500 to-indigo-500",
  },
  {
    id: 3,
    title: "Pulse Analytics",
    tagline: "Predictive data dashboard",
    description:
      "A real-time analytics dashboard that ingests millions of events, runs forecasting models and surfaces anomalies. Python powers the ETL and ML pipeline; the React frontend renders interactive charts.",
    tech: ["Python", "Pandas", "scikit-learn", "React", "PostgreSQL", "WebSockets"],
    highlights: [
      "Time-series forecasting with Prophet / XGBoost",
      "Anomaly detection on streaming data",
      "Sub-second chart updates",
    ],
    github: "#",
    demo: "#",
    image: "project-analytics",
    accent: "from-emerald-400 via-teal-500 to-cyan-500",
  },
];

export const NAV_LINKS = [
  { label: "Home",     href: "#home" },
  { label: "Skills",   href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact",  href: "#contact" },
];