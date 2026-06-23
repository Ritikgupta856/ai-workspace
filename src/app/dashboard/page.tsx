import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  CheckSquare,
  Zap,
  Brain,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    title: "Start a Chat",
    description: "Ask your AI assistant anything",
    icon: MessageSquare,
    href: "/dashboard/chat",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    title: "Manage Tasks",
    description: "View and manage your AI-generated tasks",
    icon: CheckSquare,
    href: "/dashboard/tasks",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Automations",
    description: "Set up automated AI workflows",
    icon: Zap,
    href: "/dashboard/automations",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "Knowledge Base",
    description: "Upload docs for your AI to reference",
    icon: Brain,
    href: "/dashboard/knowledge",
    color: "bg-emerald-500/10 text-emerald-600",
  },
];

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good to see you, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI workspace is ready. What would you like to do today?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${action.color}`}
              >
                <action.icon className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{action.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Open{" "}
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity placeholder */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-1">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">
            Your recent chats, tasks, and activity will appear here.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
