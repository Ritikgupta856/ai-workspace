import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!membership) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Personal",
        slug: `personal-${session.user.id.slice(0, 8)}`,
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
          <header className="flex h-16 shrink-0 items-center border-b px-4">
            <SidebarTrigger />
          </header>

          <div className="flex flex-1 flex-col gap-4 p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
