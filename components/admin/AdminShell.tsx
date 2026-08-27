import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/layout/DashboardShell";
export default function AdminShell({ title, intro, children }: { title:string; intro:string; children:React.ReactNode }) { return <DashboardShell eyebrow="Admin operations" title={title} intro={intro}><RoleGuard role="ADMIN">{children}</RoleGuard></DashboardShell>; }
