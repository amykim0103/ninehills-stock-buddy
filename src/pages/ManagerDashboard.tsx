import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import CategoryAccordion from "@/components/CategoryAccordion";
import { NeedBuyBadge } from "@/components/NeedBuyBadge";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { Navigate, useNavigate } from "react-router-dom";
import { Item } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatKoreanDate, normalizeQty } from "@/lib/utils-date";
import { toast } from "sonner";
import { CheckCircle2, MessageSquarePlus, Truck, PackageCheck } from "lucide-react";

export default function ManagerDashboard() {
  const { role } = useSession();
  const navigate = useNavigate();
  const {
    items,
    ensureCurrentSubmission,
    getSubmission,
    saveStockEntry,
    receiveOrderLine,
  } = useStore();

  const [submissionId, setSubmissionId] = useState<string>("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [showMemoFor, setShowMemoFor] = useState<string | null>(null);
  const [generalMemo, setGeneralMemo] = useState("");

  useEffect(() => {
    const id = ensureCurrentSubmission();
    setSubmissionId(id);
    const sub = getSubmission(id);
    if (sub) {
      setQty(Object.fromEntries(Object.entries(sub.stock).map(([k, v]) => [k, String(v)])));
      setMemos(sub.itemMemos);
      setGeneralMemo(sub.generalMemo);
    }
  }, [ensureCurrentSubmission, getSubmission]);

  if (role !== "manager") return <Navigate to="/" replace />;

  const submission = submissionId ? getSubmission(submissionId) : undefined;
  const activeItems = useMemo(() => items.filter((i) => i.active), [items]);

  // 발주 도착 대기중인 라인
  const pendingDeliveries = useMemo(() => {
    if (!submission || submission.status === "stocked") return [];
    return submission.orders.filter((o) => !o.received && o.orderQty > 0);
  }, [submission]);

  const numericQty = (id: string): number => normalizeQty(qty[id] ?? "0");

  const handleSave = () => {
    if (!submissionId) return;
    const stock: Record<string, number> = {};
    for (const it of activeItems) {
      const v = numericQty(it.id);
      if (qty[it.id] !== undefined && qty[it.id] !== "") stock[it.id] = v;
    }
    saveStockEntry(submissionId, stock, memos, generalMemo);
    toast.success("재고가 저장되었습니다");
  };

  const handleReceive = (itemId: string) => {
    if (!submissionId) return;
    receiveOrderLine(submissionId, itemId);
    toast.success("입고 완료 · 재고가 자동으로 갱신되었습니다");
  };

  const renderItem = (it: Item) => {
    const v = numericQty(it.id);
    const below = it.safetyStock > 0 && qty[it.id] !== undefined && qty[it.id] !== "" && v < it.safetyStock;
    const isOpen = showMemoFor === it.id;
    return (
      <div
        key={it.id}
        className="rounded-xl bg-background/60 p-3 border border-border/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{it.name}</span>
              {below && <NeedBuyBadge />}
            </div>
            {it.safetyStock > 0 && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                안전재고 {it.safetyStock}
              </div>
            )}
          </div>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            placeholder="0"
            value={qty[it.id] ?? ""}
            onChange={(e) => setQty((q) => ({ ...q, [it.id]: e.target.value }))}
            className="w-20 h-11 text-center text-base font-semibold bg-card"
          />
          <button
            type="button"
            onClick={() => setShowMemoFor(isOpen ? null : it.id)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>
        {isOpen && (
          <Input
            placeholder="이 품목 메모"
            value={memos[it.id] ?? ""}
            onChange={(e) => setMemos((m) => ({ ...m, [it.id]: e.target.value }))}
            className="mt-2 bg-card"
          />
        )}
        {memos[it.id] && !isOpen && (
          <div className="mt-1.5 text-[11px] text-muted-foreground italic">📝 {memos[it.id]}</div>
        )}
      </div>
    );
  };

  return (
    <AppShell title="주간 재고 입력">
      {submission && (
        <div className="card-warm p-4 mb-4 bg-gradient-coffee text-primary-foreground">
          <div className="text-[11px] tracking-widest uppercase opacity-70">이번 주 일요일</div>
          <div className="text-xl font-bold mt-0.5">{formatKoreanDate(submission.weekDate)}</div>
          <div className="text-xs mt-2 opacity-80">
            상태:{" "}
            <span className="font-semibold">
              {submission.status === "stocked" && "재고 입력 중"}
              {submission.status === "ordered" && "발주 진행 중"}
              {submission.status === "completed" && "이번 주 완료"}
            </span>
          </div>
        </div>
      )}

      {pendingDeliveries.length > 0 && (
        <div className="card-warm p-4 mb-4 border-l-4 border-accent">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-sm">입고 대기 ({pendingDeliveries.length})</h2>
          </div>
          <div className="space-y-2">
            {pendingDeliveries.map((line) => {
              const it = items.find((x) => x.id === line.itemId);
              if (!it) return null;
              return (
                <div
                  key={line.itemId}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/60"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{it.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      발주 {line.orderQty}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReceive(line.itemId)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 h-9"
                  >
                    <PackageCheck className="w-4 h-4 mr-1" />
                    입고확정
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CategoryAccordion items={activeItems} renderItem={renderItem} />

      <div className="card-warm p-4 mt-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          전체 메모
        </label>
        <Textarea
          value={generalMemo}
          onChange={(e) => setGeneralMemo(e.target.value)}
          placeholder="이번 주 전반적인 메모를 남겨주세요"
          className="mt-2 bg-background min-h-[80px]"
        />
      </div>

      <Button
        onClick={handleSave}
        className="w-full mt-5 h-14 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated"
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        재고 저장
      </Button>

      <button
        onClick={() => navigate("/items")}
        className="w-full mt-3 text-sm text-muted-foreground py-3"
      >
        + 품목 관리
      </button>
    </AppShell>
  );
}
