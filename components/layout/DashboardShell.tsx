import AppHeader from "./AppHeader";

export default function DashboardShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-[1200px] px-6 pt-10 pb-24 md:px-12">
    <AppHeader />
    <header className="mt-14 max-w-3xl"><div className="label label-ochre">{eyebrow}</div><h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{title}</h1><p className="mt-4 text-[1.02rem] leading-relaxed text-ink/75">{intro}</p></header>
    <span className="rule my-10" aria-hidden />
    {children}
  </main>;
}
