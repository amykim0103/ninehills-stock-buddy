import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "@/lib/session";
import { Coffee, LogOut, Package, History, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: Props) {
  const { role, logout } = useSession();
  const navigate = useNavigate();
  const loc = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems =
    role === "manager"
      ? [
          { to: "/manager", label: "재고입력", icon: ClipboardList },
          { to: "/items", label: "품목", icon: Package },
          { to: "/history", label: "기록", icon: History },
        ]
      : role === "owner"
      ? [
          { to: "/owner", label: "발주", icon: ClipboardList },
          { to: "/items", label: "품목", icon: Package },
          { to: "/history", label: "기록", icon: History },
        ]
      : [];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto pb-24">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-coffee flex items-center justify-center shadow-soft">
              <Coffee className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Ninehill</div>
              <div className="text-base font-semibold leading-tight">{title ?? "나인힐 재고"}</div>
            </div>
          </div>
          {role && (
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground flex items-center gap-1 px-3 py-2 rounded-full hover:bg-secondary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {role === "owner" ? "대표" : "매니저"}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-5">{children}</main>

      {role && navItems.length > 0 && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border/60 shadow-elevated">
          <div className="grid grid-cols-3 px-2 py-2">
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
      )}
    </div>
  );
}
