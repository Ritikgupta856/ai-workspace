import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchCommand } from "@/components/layout/search-command";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

  let membership = null;
  if (activeWorkspaceId) {
    membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: activeWorkspaceId,
      },
    })
  }

  if (!membership) {
    membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })
  }

  if (!membership) {
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
  }

  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    avatar: session.user.image ?? "",
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={user} />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
            <SidebarTrigger />
            <SearchCommand />
          </header>

          <div className="flex flex-1 flex-col gap-4 p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
