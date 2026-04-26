import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import CategoryAccordion from "@/components/CategoryAccordion";
import { NeedBuyBadge } from "@/components/NeedBuyBadge";
import { useStore, recommendOrderQty } from "@/lib/store";
import { Item, OrderLine } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatKoreanDate, formatQty, getSundayOfWeek } from "@/lib/utils-date";
import { toast } from "sonner";
import { Send, ShoppingCart, AlertCircle, Sparkles, Package } from "lucide-react";

export default function OwnerDashboard() {
  const items = useStore((s) => s.items);
  const saveOrders = useStore((s) => s.saveOrders);
  const ensureCurrentSubmission = useStore((s) => s.ensureCurrentSubmission);

  // 마운트 시 이번 주 submission 보장 (없으면 생성)
  useEffect(() => {
    ensureCurrentSubmission();
  }, [ensureCurrentSubmission]);

  // 항상 store에서 직접 이번 주 submission을 구독 — 매니저가 저장하면 즉시 반영
  const weekDate = getSundayOfWeek();
  const submission = useStore((s) =>
    s.submissions.find((x) => x.weekDate === weekDate)
  );

  const [orderQty, setOrderQty] = useState<Record<string, string>>({});

  // 기존 발주 prefill
  useEffect(() => {
    if (submission && submission.orders.length > 0) {
      const map: Record<string, string> = {};
      for (const o of submission.orders) map[o.itemId] = String(o.orderQty);
      setOrderQty(map);
    }
  }, [submission?.id]);

  const activeItems = useMemo(() => items.filter((i) => i.active), [items]);

  // 자동 추천 적용
  const applyRecommendations = () => {
    if (!submission) return;
    const map: Record<string, string> = { ...orderQty };
    for (const it of activeItems) {
      const stock = submission.stock[it.id] ?? 0;
      const rec = recommendOrderQty(stock, it.safetyStock);
      if (rec > 0 && (!map[it.id] || map[it.id] === "0" || map[it.id] === "")) {
        map[it.id] = String(rec);
      }
    }
    setOrderQty(map);
    toast.success("자동 추천이 적용되었습니다");
  };

  const needBuyItems = useMemo(() => {
    if (!submission) return [] as Item[];
    return activeItems.filter((it) => {
      if (it.type === "needOrder") {
        return !!submission.needOrderFlags?.[it.id];
      }
      const v = submission.stock[it.id];
      return it.safetyStock > 0 && v !== undefined && v < it.safetyStock;
    });
  }, [activeItems, submission]);

  const handleSubmit = () => {
    if (!submission) return;
    const orders: OrderLine[] = [];
    for (const it of activeItems) {
      const raw = orderQty[it.id];
      const n = raw ? parseFloat(raw) : 0;
      if (n > 0) orders.push({ itemId: it.id, orderQty: n, received: false });
    }
    if (orders.length === 0) {
      toast.error("발주할 품목을 입력해주세요");
      return;
    }
    saveOrders(submission.id, orders);
    toast.success(`${orders.length}개 품목 발주 완료 · 매니저에게 전달됩니다`);
  };

  const renderItem = (it: Item) => {
    const isNeedOrder = it.type === "needOrder";
    const flagged = isNeedOrder && !!submission?.needOrderFlags?.[it.id];
    const stock = submission?.stock[it.id];
    const hasStock = !isNeedOrder && stock !== undefined;
    const below = !isNeedOrder && it.safetyStock > 0 && hasStock && stock! < it.safetyStock;
    const rec = hasStock ? recommendOrderQty(stock!, it.safetyStock) : 0;
    const itemMemo = submission?.itemMemos[it.id];

    return (
      <div key={it.id} className="rounded-xl bg-background/60 p-3 border border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{it.name}</span>
              {(below || flagged) && <NeedBuyBadge />}
            </div>
            {isNeedOrder ? (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                주문필요형 · {flagged ? "주문 필요" : "충분"}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-2">
                <span>현재 {hasStock ? formatQty(stock!) : "-"}</span>
                <span>·</span>
                <span>안전 {it.safetyStock || "-"}</span>
                {rec > 0 && (
                  <span className="text-accent font-semibold">· 추천 {rec}</span>
                )}
              </div>
            )}
          </div>
          {!isNeedOrder && (
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder="발주"
              value={orderQty[it.id] ?? ""}
              onChange={(e) => setOrderQty((q) => ({ ...q, [it.id]: e.target.value }))}
              className="w-20 h-11 text-center text-base font-semibold bg-card"
            />
          )}
        </div>
        {itemMemo && (
          <div className="mt-2 text-[11px] text-muted-foreground italic px-2 py-1 rounded bg-secondary/60">
            매니저 메모: {itemMemo}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell title="발주 관리">
      {submission && (
        <div className="card-warm p-4 mb-4 bg-gradient-coffee text-primary-foreground">
          <div className="text-[11px] tracking-widest uppercase opacity-70">검토 주차</div>
          <div className="text-xl font-bold mt-0.5">{formatKoreanDate(submission.weekDate)}</div>
          {submission.generalMemo && (
            <div className="text-xs mt-2 opacity-90 italic">📝 {submission.generalMemo}</div>
          )}
        </div>
      )}

      {needBuyItems.length > 0 && (
        <div className="card-warm p-4 mb-4 border-l-4 border-destructive">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <h2 className="font-semibold text-sm">
              구매 필요 ({needBuyItems.length})
            </h2>
          </div>
          <div className="space-y-1.5">
            {needBuyItems.map((it) => {
              if (it.type === "needOrder") {
                return (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span className="truncate flex-1">{it.name}</span>
                    <span className="text-accent font-semibold ml-2">주문필요</span>
                  </div>
                );
              }
              const stock = submission?.stock[it.id] ?? 0;
              const rec = recommendOrderQty(stock, it.safetyStock);
              return (
                <div key={it.id} className="flex justify-between text-sm">
                  <span className="truncate flex-1">{it.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatQty(stock)}/{it.safetyStock}
                    <span className="text-accent font-semibold"> → +{rec}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={applyRecommendations}
        variant="outline"
        className="w-full mb-4 h-12 bg-card border-accent/30 hover:bg-accent/10"
      >
        <Sparkles className="w-4 h-4 mr-2 text-accent" />
        자동 추천 발주량 적용
      </Button>

      {!submission ||
      Object.keys(submission.stock).length === 0 ? (
        <div className="card-warm p-8 text-center text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">아직 매니저가 재고를 입력하지 않았습니다.</p>
        </div>
      ) : (
        <CategoryAccordion
          items={activeItems}
          renderItem={renderItem}
          badgeFor={(_cat, list) => {
            const n = list.filter((it) => {
              const v = submission!.stock[it.id];
              return it.safetyStock > 0 && v !== undefined && v < it.safetyStock;
            }).length;
            if (n === 0) return null;
            return (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
                {n}
              </span>
            );
          }}
        />
      )}

      <Button
        onClick={handleSubmit}
        className="w-full mt-5 h-14 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated"
      >
        <Send className="w-5 h-5 mr-2" />
        발주 확정
      </Button>

      {submission?.status === "ordered" && (
        <div className="mt-3 text-center text-xs text-success font-semibold flex items-center justify-center gap-1">
          <ShoppingCart className="w-3.5 h-3.5" />
          이미 발주가 진행되었습니다 (수정 가능)
        </div>
      )}
    </AppShell>
  );
}
