import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { Navigate } from "react-router-dom";
import { formatKoreanDate, formatQty } from "@/lib/utils-date";
import { ChevronRight, Calendar, ArrowLeft, Package, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Submission } from "@/lib/types";

export default function History() {
  const { role } = useSession();
  const { submissions, items } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!role) return <Navigate to="/" replace />;

  const sorted = useMemo(
    () => [...submissions].sort((a, b) => b.weekDate.localeCompare(a.weekDate)),
    [submissions]
  );

  if (selectedId) {
    const sub = submissions.find((s) => s.id === selectedId);
    if (!sub) return null;
    return <Detail sub={sub} items={items} onBack={() => setSelectedId(null)} />;
  }

  return (
    <AppShell title="기록">
      {sorted.length === 0 ? (
        <div className="card-warm p-10 text-center text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">아직 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((s) => {
            const stockCount = Object.keys(s.stock).length;
            const orderCount = s.orders.filter((o) => o.orderQty > 0).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="w-full card-warm p-4 flex items-center gap-3 text-left hover:shadow-elevated transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{formatKoreanDate(s.weekDate)}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    재고 {stockCount} · 발주 {orderCount} · {labelStatus(s.status)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function labelStatus(s: Submission["status"]) {
  if (s === "stocked") return "재고입력";
  if (s === "ordered") return "발주완료";
  return "입고완료";
}

function Detail({
  sub,
  items,
  onBack,
}: {
  sub: Submission;
  items: ReturnType<typeof useStore.getState>["items"];
  onBack: () => void;
}) {
  const stockEntries = Object.entries(sub.stock);
  const orderedItems = sub.orders.filter((o) => o.orderQty > 0);

  return (
    <AppShell title="주간 상세">
      <button
        onClick={onBack}
        className="text-xs text-muted-foreground flex items-center gap-1 mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> 목록으로
      </button>

      <div className="card-warm p-4 mb-4 bg-gradient-coffee text-primary-foreground">
        <div className="text-[11px] tracking-widest uppercase opacity-70">주차</div>
        <div className="text-xl font-bold">{formatKoreanDate(sub.weekDate)}</div>
        <div className="text-xs mt-1 opacity-80">{labelStatus(sub.status)}</div>
        {sub.generalMemo && (
          <div className="text-xs mt-2 opacity-90 italic">📝 {sub.generalMemo}</div>
        )}
      </div>

      <Section icon={<Package className="w-4 h-4" />} title={`재고 (${stockEntries.length})`}>
        {stockEntries.length === 0 && (
          <p className="text-sm text-muted-foreground">기록 없음</p>
        )}
        <div className="space-y-1.5">
          {stockEntries.map(([id, qty]) => {
            const it = items.find((x) => x.id === id);
            const memo = sub.itemMemos[id];
            return (
              <div key={id} className="text-sm">
                <div className="flex justify-between">
                  <span className="truncate flex-1">{it?.name ?? "삭제된 품목"}</span>
                  <span className="font-semibold ml-2">{formatQty(qty)}</span>
                </div>
                {memo && (
                  <div className="text-[11px] text-muted-foreground italic ml-2">↳ {memo}</div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {orderedItems.length > 0 && (
        <Section icon={<ShoppingCart className="w-4 h-4" />} title={`발주 (${orderedItems.length})`}>
          <div className="space-y-1.5">
            {orderedItems.map((o) => {
              const it = items.find((x) => x.id === o.itemId);
              return (
                <div key={o.itemId} className="flex justify-between text-sm items-center">
                  <span className="truncate flex-1">{it?.name ?? "삭제됨"}</span>
                  <span className="ml-2 flex items-center gap-1.5">
                    <span className="font-semibold">+{o.orderQty}</span>
                    {o.received && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </AppShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-warm p-4 mb-3">
      <div className="flex items-center gap-2 mb-3 text-primary">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}
