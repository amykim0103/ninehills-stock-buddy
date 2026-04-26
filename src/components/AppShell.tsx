import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Coffee, Package, History, ClipboardList, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { to: "/", label: "재고입력", icon: ClipboardList },
  { to: "/order", label: "발주", icon: ShoppingCart },
  { to: "/items", label: "품목", icon: Package },
  { to: "/history", label: "기록", icon: History },
];

export default function AppShell({ children, title }: Props) {
  const loc = useLocation();

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto pb-24">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-gradient-coffee flex items-center justify-center shadow-soft">
            <Coffee className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Ninehill</div>
            <div className="text-base font-semibold leading-tight">{title ?? "나인힐 재고"}</div>
          </div>
        </div>
        <div className="flex px-5 gap-1 border-t border-border/60">
          <div className="px-3 py-2.5 text-sm font-semibold text-foreground border-b-2 border-primary -mb-px">
            재고현황
          </div>
          <Link
            to="/recipes"
            className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            레시피
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border/60 shadow-elevated">
        <div className="grid grid-cols-4 px-2 py-2">
          {navItems.map((n) => {
            const active = loc.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs transition-colors",
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "text-accent")} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
