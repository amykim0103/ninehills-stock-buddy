import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, ChevronRight, KeyRound, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Mode = "select" | "manager" | "owner";

export default function Login() {
  const [mode, setMode] = useState<Mode>("select");
  const [pin, setPin] = useState("");
  const [pw, setPw] = useState("");
  const { managerPin, ownerPassword } = useStore();
  const setRole = useSession((s) => s.setRole);
  const navigate = useNavigate();

  const submitManager = () => {
    if (pin === managerPin) {
      setRole("manager");
      navigate("/manager");
    } else {
      toast.error("PIN이 올바르지 않습니다");
      setPin("");
    }
  };
  const submitOwner = () => {
    if (pw === ownerPassword) {
      setRole("owner");
      navigate("/owner");
    } else {
      toast.error("비밀번호가 올바르지 않습니다");
      setPw("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center max-w-md mx-auto px-6 py-10">
      <div className="w-full">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-coffee flex items-center justify-center shadow-elevated mb-5">
            <Coffee className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="text-[11px] tracking-[0.32em] text-muted-foreground uppercase mb-1">
            Cafe Ninehill
          </div>
          <h1 className="text-3xl font-bold text-primary">나인힐 재고관리</h1>
          <p className="text-sm text-muted-foreground mt-2">매주 일요일, 함께 채워요</p>
        </div>

        {mode === "select" && (
          <div className="space-y-3">
            <RoleCard
              icon={<KeyRound className="w-5 h-5" />}
              title="매니저"
              desc="PIN으로 로그인 · 재고 입력"
              onClick={() => setMode("manager")}
            />
            <RoleCard
              icon={<Lock className="w-5 h-5" />}
              title="대표"
              desc="비밀번호로 로그인 · 발주 관리"
              onClick={() => setMode("owner")}
            />
            <p className="text-xs text-center text-muted-foreground/70 pt-6">
              초기 PIN/비밀번호: <span className="font-mono">1234 / 0000</span>
            </p>
          </div>
        )}

        {mode === "manager" && (
          <PinForm
            label="매니저 PIN"
            value={pin}
            onChange={setPin}
            onSubmit={submitManager}
            onBack={() => setMode("select")}
          />
        )}
        {mode === "owner" && (
          <PinForm
            label="대표 비밀번호"
            value={pw}
            onChange={setPw}
            onSubmit={submitOwner}
            onBack={() => setMode("select")}
          />
        )}
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full card-warm p-5 flex items-center justify-between text-left hover:shadow-elevated transition-all active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-base">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}

function PinForm({
  label,
  value,
  onChange,
  onSubmit,
  onBack,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="card-warm p-6 space-y-5"
    >
      <div>
        <label className="text-sm font-medium text-primary">{label}</label>
        <Input
          autoFocus
          type="password"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="mt-2 h-14 text-center text-2xl tracking-[0.5em] font-semibold bg-background"
          placeholder="••••"
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          뒤로
        </Button>
        <Button type="submit" className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90">
          로그인
        </Button>
      </div>
    </form>
  );
}
