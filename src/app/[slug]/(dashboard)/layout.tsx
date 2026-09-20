import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { MemberRoleKey } from "@/lib/constants";
import { getSidebarData } from "@/lib/sidebar-data";

export const instant = false;

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      workspaceId: true,
      role: true,
      workspace: { select: { id: true, name: true, slug: true } },
    },
  });

  if (memberships.length === 0) {
    // First-ever visit with no workspace at all — create one, then land on
    // its real URL rather than rendering under whatever slug was requested.
    const workspace = await prisma.workspace.create({
      data: {
        name: `${session.user.name?.split(" ")[0] ?? "Personal"}'s workspace`,
        slug: `${(session.user.name?.split(" ")[0] ?? "personal").toLowerCase()}-${session.user.id.slice(0, 8)}`,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    })
    redirect(`/${workspace.slug}/agent`)
  }

  const membership = memberships.find((m) => m.workspace.slug === slug);

  if (!membership) {
    // Either the slug doesn't exist, or it belongs to a workspace this user
    // isn't a member of — either way, send them to a workspace they're
    // actually in rather than a 404 or someone else's data.
    const workspaceExists = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspaceExists) notFound();
    redirect(`/${memberships[0].workspace.slug}/agent`);
  }

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role as MemberRoleKey,
  }));

  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    avatar: session.user.image ?? "",
  };

  // Rendered into the sidebar's first paint — no client fetch, no pop-in.
  const sidebar = await getSidebarData(session.user.id, membership.workspaceId, slug);

  return (
    <TooltipProvider>
        <SidebarProvider className="overflow-hidden max-h-dvh">
        <AppSidebar
          user={user}
          workspaces={workspaces}
          activeWorkspaceId={membership.workspaceId}
          slug={slug}
          initialData={sidebar}
        />

        {/* min-h-0 lets the inset respect the provider's max-h-dvh instead of
            growing past it — without it the scroll container below never gets
            a bounded height and tall pages just get clipped. */}
        <SidebarInset className="min-h-0">
          <div className="flex flex-1 flex-col gap-4 min-h-0 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
