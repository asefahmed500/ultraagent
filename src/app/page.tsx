import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  Command,
  FileText,
  Inbox,
  LockKeyhole,
  NotebookPen,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const capabilities = [
  { icon: Inbox, title: "Inbox", description: "Triage, label and draft replies." },
  { icon: Sparkles, title: "Calendar", description: "Find a slot and send invites." },
  { icon: FileText, title: "Documents", description: "Summaries with citations." },
  { icon: BarChart3, title: "Reports", description: "Metrics, charts and versions." },
  { icon: NotebookPen, title: "Meetings", description: "Notes, decisions, actions." },
  { icon: ShieldCheck, title: "Approvals", description: "Policy checks and routing." },
];

const principles = [
  { icon: Command, label: "Plan first" },
  { icon: Activity, label: "Visible steps" },
  { icon: RotateCcw, label: "Always undo" },
  { icon: LockKeyhole, label: "Full control" },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">UltraAgent</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#trust" className="transition-colors hover:text-foreground">Trust</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started <ArrowRight data-icon="inline-end" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative border-b border-border/70 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-background/75 to-background" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-20 sm:px-8 sm:pt-24 lg:px-10 lg:pb-24 lg:pt-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge variant="secondary" className="mb-8 gap-2 rounded-full border-border/60 bg-background/80 px-3.5 py-1.5 text-xs shadow-sm backdrop-blur">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Private beta
            </Badge>
            <h1 className="text-balance text-5xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]">
              Your office, on autopilot.
            </h1>
            <p className="mt-7 max-w-xl text-balance text-base leading-8 text-muted-foreground sm:text-lg">
              One instruction. UltraAgent plans, acts and shows every step — with undo and a full audit trail.
            </p>
            <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Button size="lg" className="h-11 w-full px-6 text-sm sm:w-auto" asChild>
                <Link href="/signup">Start free <ArrowRight data-icon="inline-end" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 w-full px-6 text-sm sm:w-auto" asChild>
                <Link href="/login">View demo</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              <code className="rounded-md border bg-muted px-1.5 py-0.5 text-[11px]">demo@ultraagent.ai</code>
              <span className="mx-2">/</span>
              <code className="rounded-md border bg-muted px-1.5 py-0.5 text-[11px]">demo1234</code>
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-4xl lg:mt-16">
            <Card className="overflow-hidden rounded-2xl border-border/80 shadow-2xl shadow-foreground/10">
              <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-3.5">
                <span className="size-2.5 rounded-full bg-rose-400/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-xs font-medium text-muted-foreground">Command bar</span>
                <Badge variant="outline" className="ml-auto text-[10px]">Live run</Badge>
              </div>
              <CardContent className="p-5 sm:p-8">
                <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3.5 shadow-sm">
                  <Command className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">Sort my inbox and reply to Dana</span>
                  <span className="ml-auto shrink-0 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">RUN</span>
                </div>
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {["Read new mail", "Classify messages", "Apply labels", "Draft replies"].map((title, index) => (
                    <div key={title} className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
                      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${index < 3 ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {index < 3 ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
                      </span>
                      <span className="truncate text-sm">{title}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
                  <Check className="size-4 shrink-0 text-emerald-600" /> 4 steps complete · Undo available
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { icon: Timer, value: "< 10 min", label: "First value" },
              { icon: Sparkles, value: "6 skills", label: "Ready to run" },
              { icon: ShieldCheck, value: "L0–L3", label: "Autonomy" },
              { icon: RotateCcw, value: "Undo", label: "Every action" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5 rounded-2xl border bg-card/70 px-5 py-5">
                <stat.icon className="size-4 text-muted-foreground" />
                <span className="text-xl font-semibold tracking-tight">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="flex max-w-xl flex-col gap-3">
          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">Features</Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">One instruction. Done.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="rounded-2xl border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5">
              <CardHeader className="gap-3 p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <capability.icon className="size-5" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <CardTitle className="text-base">{capability.title}</CardTitle>
                  <CardDescription className="text-sm">{capability.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="trust" className="border-y border-border/70 bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex max-w-md flex-col gap-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">Trust by design</Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Visible. Reversible. In control.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {principles.map((principle) => (
              <div key={principle.label} className="flex items-center gap-2.5 rounded-xl border bg-background px-4 py-3">
                <principle.icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{principle.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border bg-card px-6 py-16 text-center shadow-xl shadow-foreground/5">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Start in under 10 minutes.</h2>
          <Button size="lg" className="h-11 px-6 text-sm" asChild>
            <Link href="/signup">Create your workspace <ArrowRight data-icon="inline-end" /></Link>
          </Button>
        </div>
      </section>

      <Separator />
      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:px-8 lg:px-10">
        <span>© 2026 UltraAgent. Do the work, show the work, stay in control.</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="transition-colors hover:text-foreground">Sign in</Link>
          <Link href="/signup" className="transition-colors hover:text-foreground">Get started</Link>
        </div>
      </footer>
    </main>
  );
}
