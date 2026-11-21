import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 lg:px-16">
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">UltraAgent</span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">
          Do the work. Show the work. Stay in control.
        </p>
      </div>
      <div className="relative hidden overflow-hidden border-l bg-grid lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/85 to-background" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <div className="max-w-md">
            <div className="text-6xl font-semibold leading-[1.05] tracking-[-0.05em]">
              Your office,
              <br />
              <span className="text-muted-foreground">on autopilot.</span>
            </div>
            <p className="mt-8 text-base leading-7 text-muted-foreground">
              One instruction sorts your inbox, schedules your meetings, summarizes your
              documents and routes your approvals — with every step visible and reversible.
            </p>
            <div className="mt-12 flex flex-col gap-3 text-sm">
              {[
                "Plan first, act second",
                "Named steps, never anonymous spinners",
                "Undo and Activity one click away",
                "Permissions, policies and approvals by design",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-foreground" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
