import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { Navigate } from "react-router-dom";
import { CATEGORIES, CategoryKey } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Eye, EyeOff, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import CategoryAccordion from "@/components/CategoryAccordion";

export default function ItemsManagement() {
  const { role } = useSession();
  const { items, addItem, updateItem, toggleActive, managerPin, ownerPassword, setManagerPin, setOwnerPassword } =
    useStore();
  const [showInactive, setShowInactive] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState<CategoryKey>("시럽");
  const [safety, setSafety] = useState("");

  // 비번/PIN 변경
  const [credOpen, setCredOpen] = useState(false);
  const [newManagerPin, setNewManagerPin] = useState("");
  const [newOwnerPw, setNewOwnerPw] = useState("");

  if (!role) return <Navigate to="/" replace />;

  const visible = items.filter((i) => (showInactive ? true : i.active));

  const handleAdd = () => {
    if (!name.trim()) return toast.error("품목명을 입력해주세요");
    addItem(name, cat, parseInt(safety || "0", 10) || 0);
    setName("");
    setSafety("");
    setOpen(false);
    toast.success(`${name} 추가됨`);
  };

  const saveCreds = () => {
    if (newManagerPin && /^\d{4,8}$/.test(newManagerPin)) {
      setManagerPin(newManagerPin);
    }
    if (newOwnerPw) {
      setOwnerPassword(newOwnerPw);
    }
    toast.success("저장되었습니다");
    setCredOpen(false);
    setNewManagerPin("");
    setNewOwnerPw("");
  };

  return (
    <AppShell title="품목 관리">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowInactive((v) => !v)}
          className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-2 rounded-full bg-card surface-soft"
        >
          {showInactive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showInactive ? "활성만 보기" : "시즌종료 포함"}
        </button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" />
              품목 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>새 품목 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="품목명"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <Select value={cat} onValueChange={(v) => setCat(v as CategoryKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="안전재고 (선택)"
                value={safety}
                onChange={(e) => setSafety(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground">
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <CategoryAccordion
        items={visible}
        renderItem={(it) => (
          <div
            key={it.id}
            className={`rounded-xl bg-background/60 p-3 border border-border/40 ${
              !it.active ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                  <span>안전재고</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={it.safetyStock || ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateItem(it.id, { safetyStock: parseInt(e.target.value || "0", 10) || 0 })
                    }
                    className="w-16 h-7 text-center bg-card text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Switch
                  checked={it.active}
                  onCheckedChange={() => toggleActive(it.id)}
                />
                <span className="text-[10px] text-muted-foreground">
                  {it.active ? "활성" : "시즌종료"}
                </span>
              </div>
            </div>
          </div>
        )}
      />

      <Dialog open={credOpen} onOpenChange={setCredOpen}>
        <DialogTrigger asChild>
          <button className="w-full mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1.5 py-3">
            <Lock className="w-3.5 h-3.5" />
            로그인 정보 변경
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">매니저 PIN (현재: {managerPin})</label>
              <Input
                type="password"
                inputMode="numeric"
                value={newManagerPin}
                onChange={(e) => setNewManagerPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="새 PIN (4~8자리 숫자)"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">대표 비밀번호 (현재: {ownerPassword})</label>
              <Input
                type="password"
                value={newOwnerPw}
                onChange={(e) => setNewOwnerPw(e.target.value)}
                placeholder="새 비밀번호"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveCreds} className="w-full bg-primary text-primary-foreground">
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
