import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { CATEGORIES, CategoryKey, ItemType } from "@/lib/types";
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
import { Plus, Eye, EyeOff } from "lucide-react";
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
  const { items, addItem, updateItem, toggleActive } = useStore();
  const [showInactive, setShowInactive] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState<CategoryKey>("시럽");
  const [safety, setSafety] = useState("");
  const [newType, setNewType] = useState<ItemType>("quantity");

  const visible = items.filter((i) => (showInactive ? true : i.active));

  const handleAdd = () => {
    if (!name.trim()) return toast.error("품목명을 입력해주세요");
    const safetyNum = newType === "needOrder" ? 0 : parseInt(safety || "0", 10) || 0;
    addItem(name, cat, safetyNum, newType);
    setName("");
    setSafety("");
    setNewType("quantity");
    setOpen(false);
    toast.success(`${name} 추가됨`);
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
              <Select value={newType} onValueChange={(v) => setNewType(v as ItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">수량형 (숫자 입력)</SelectItem>
                  <SelectItem value="needOrder">주문필요형 (토글)</SelectItem>
                </SelectContent>
              </Select>
              {newType === "quantity" && (
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="안전재고 (선택)"
                  value={safety}
                  onChange={(e) => setSafety(e.target.value)}
                />
              )}
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
              <div className="flex-1 min-w-0 space-y-1.5">
                <Input
                  value={it.name}
                  onChange={(e) => updateItem(it.id, { name: e.target.value })}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (!trimmed) {
                      updateItem(it.id, { name: it.name });
                      toast.error("품목명은 비울 수 없습니다");
                    } else if (trimmed !== e.target.value) {
                      updateItem(it.id, { name: trimmed });
                    }
                  }}
                  className="h-8 text-sm font-medium bg-card"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={it.category}
                    onValueChange={(v) => updateItem(it.id, { category: v as CategoryKey })}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-[11px] bg-card">
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
                  <Select
                    value={it.type ?? "quantity"}
                    onValueChange={(v) =>
                      updateItem(it.id, {
                        type: v as ItemType,
                        ...(v === "needOrder" ? { safetyStock: 0 } : {}),
                      })
                    }
                  >
                    <SelectTrigger className="h-7 w-[110px] text-[11px] bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quantity">수량형</SelectItem>
                      <SelectItem value="needOrder">주문필요형</SelectItem>
                    </SelectContent>
                  </Select>
                  {(it.type ?? "quantity") === "quantity" && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span>안전</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={it.safetyStock || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateItem(it.id, {
                            safetyStock: parseInt(e.target.value || "0", 10) || 0,
                          })
                        }
                        className="w-14 h-7 text-center bg-card text-xs"
                      />
                    </div>
                  )}
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
    </AppShell>
  );
}
