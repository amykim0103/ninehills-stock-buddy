import { create } from "zustand";
import { AppState, Item, Submission, CategoryKey, OrderLine, ItemType } from "./types";
import { buildSeedItems } from "./seedItems";
import { getSundayOfWeek } from "./utils-date";
import { supabase } from "@/integrations/supabase/client";

interface Store extends AppState {
  /** 초기 로딩 상태 */
  loading: boolean;
  initialized: boolean;
  /** Supabase 데이터 로드 + Realtime 구독 */
  init: () => Promise<void>;

  // items
  addItem: (name: string, category: CategoryKey, safetyStock: number, type?: ItemType) => Promise<void>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  reorderItems: (category: CategoryKey, orderedIds: string[]) => Promise<void>;

  // submissions
  ensureCurrentSubmission: () => Promise<string>;
  getSubmission: (id: string) => Submission | undefined;
  getCurrentSubmission: () => Submission | undefined;
  saveStockEntry: (
    submissionId: string,
    stock: Record<string, number>,
    needOrderFlags: Record<string, boolean>,
    itemMemos: Record<string, string>,
    generalMemo: string
  ) => Promise<void>;
  saveOrders: (submissionId: string, orders: OrderLine[]) => Promise<void>;
  receiveOrderLine: (submissionId: string, itemId: string) => Promise<void>;
}

// ===== DB row <-> 앱 모델 변환 =====
// DB 컬럼: snake_case  / 앱 모델: camelCase
function rowToItem(r: any): Item {
  return {
    id: r.id,
    name: r.name,
    category: r.category as CategoryKey,
    safetyStock: r.safety_stock ?? 0,
    active: r.active,
    type: (r.type ?? "quantity") as ItemType,
    sortOrder: r.sort_order ?? 0,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function rowToSubmission(r: any): Submission {
  return {
    id: r.id,
    weekDate: r.week_date,
    createdAt: new Date(r.created_at).getTime(),
    stock: r.stock ?? {},
    needOrderFlags: r.need_order_flags ?? {},
    itemMemos: r.item_memos ?? {},
    generalMemo: r.general_memo ?? "",
    status: r.status,
    orders: r.orders ?? [],
    orderedAt: r.ordered_at ? new Date(r.ordered_at).getTime() : undefined,
  };
}

const initial: AppState = { items: [], submissions: [] };

export const useStore = create<Store>()((set, get) => ({
  ...initial,
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true, initialized: true });

    // 1) 초기 로드
    const [itemsRes, subsRes] = await Promise.all([
      supabase.from("items").select("*"),
      supabase.from("submissions").select("*"),
    ]);

    let items = (itemsRes.data ?? []).map(rowToItem);
    const submissions = (subsRes.data ?? []).map(rowToSubmission);

    // 2) DB가 비어있으면 시드 데이터 자동 입력
    if (items.length === 0) {
      const seedRows = buildSeedItems().map((it) => ({
        name: it.name,
        category: it.category,
        safety_stock: it.safetyStock,
        active: it.active,
        type: it.type,
        sort_order: it.sortOrder,
      }));
      const { data: inserted } = await supabase
        .from("items")
        .insert(seedRows)
        .select("*");
      items = (inserted ?? []).map(rowToItem);
    }

    set({ items, submissions, loading: false });

    // 3) Realtime 구독
    supabase
      .channel("items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        (payload) => {
          set((s) => {
            if (payload.eventType === "DELETE") {
              return { items: s.items.filter((i) => i.id !== (payload.old as any).id) };
            }
            const next = rowToItem(payload.new);
            const exists = s.items.some((i) => i.id === next.id);
            return {
              items: exists
                ? s.items.map((i) => (i.id === next.id ? next : i))
                : [...s.items, next],
            };
          });
        }
      )
      .subscribe();

    supabase
      .channel("submissions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        (payload) => {
          set((s) => {
            if (payload.eventType === "DELETE") {
              return {
                submissions: s.submissions.filter(
                  (x) => x.id !== (payload.old as any).id
                ),
              };
            }
            const next = rowToSubmission(payload.new);
            const exists = s.submissions.some((x) => x.id === next.id);
            return {
              submissions: exists
                ? s.submissions.map((x) => (x.id === next.id ? next : x))
                : [...s.submissions, next],
            };
          });
        }
      )
      .subscribe();
  },

  addItem: async (name, category, safetyStock, type = "quantity") => {
    const maxOrder = get()
      .items.filter((i) => i.category === category)
      .reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1);
    const { data, error } = await supabase
      .from("items")
      .insert({
        name: name.trim(),
        category,
        safety_stock: safetyStock,
        active: true,
        type,
        sort_order: maxOrder + 1,
      })
      .select("*")
      .single();
    if (error) throw error;
    if (data) {
      const it = rowToItem(data);
      set((s) =>
        s.items.some((x) => x.id === it.id)
          ? s
          : { items: [...s.items, it] }
      );
    }
  },

  updateItem: async (id, patch) => {
    const target = get().items.find((i) => i.id === id);
    if (!target) return;
    const movingCategory =
      patch.category !== undefined && patch.category !== target.category;
    const newSortOrder = movingCategory
      ? get()
          .items.filter((i) => i.category === patch.category)
          .reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1) + 1
      : target.sortOrder;

    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.safetyStock !== undefined) dbPatch.safety_stock = patch.safetyStock;
    if (patch.active !== undefined) dbPatch.active = patch.active;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    dbPatch.sort_order = newSortOrder;

    // 낙관적 업데이트
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id ? { ...i, ...patch, sortOrder: newSortOrder } : i
      ),
    }));
    await supabase.from("items").update(dbPatch).eq("id", id);
  },

  toggleActive: async (id) => {
    const target = get().items.find((i) => i.id === id);
    if (!target) return;
    const next = !target.active;
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, active: next } : i)),
    }));
    await supabase.from("items").update({ active: next }).eq("id", id);
  },

  reorderItems: async (category, orderedIds) => {
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    set((s) => ({
      items: s.items.map((i) =>
        i.category === category && orderMap.has(i.id)
          ? { ...i, sortOrder: orderMap.get(i.id)! }
          : i
      ),
    }));
    // 일괄 업데이트
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from("items").update({ sort_order: idx }).eq("id", id)
      )
    );
  },

  ensureCurrentSubmission: async () => {
    const weekDate = getSundayOfWeek();
    const existing = get().submissions.find((s) => s.weekDate === weekDate);
    if (existing) return existing.id;

    // upsert로 동시성 방지
    const { data, error } = await supabase
      .from("submissions")
      .upsert(
        {
          week_date: weekDate,
          stock: {},
          need_order_flags: {},
          item_memos: {},
          general_memo: "",
          status: "stocked",
          orders: [],
        },
        { onConflict: "week_date", ignoreDuplicates: false }
      )
      .select("*")
      .single();
    if (error) throw error;
    const sub = rowToSubmission(data);
    set((s) =>
      s.submissions.some((x) => x.id === sub.id)
        ? s
        : { submissions: [...s.submissions, sub] }
    );
    return sub.id;
  },

  getSubmission: (id) => get().submissions.find((s) => s.id === id),

  getCurrentSubmission: () => {
    const weekDate = getSundayOfWeek();
    return get().submissions.find((s) => s.weekDate === weekDate);
  },

  saveStockEntry: async (submissionId, stock, needOrderFlags, itemMemos, generalMemo) => {
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.id === submissionId
          ? { ...sub, stock, needOrderFlags, itemMemos, generalMemo, status: "stocked" }
          : sub
      ),
    }));
    await supabase
      .from("submissions")
      .update({
        stock,
        need_order_flags: needOrderFlags,
        item_memos: itemMemos,
        general_memo: generalMemo,
        status: "stocked",
      })
      .eq("id", submissionId);
  },

  saveOrders: async (submissionId, orders) => {
    const orderedAt = Date.now();
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.id === submissionId
          ? { ...sub, orders, status: "ordered", orderedAt }
          : sub
      ),
    }));
    await supabase
      .from("submissions")
      .update({
        orders: orders as any,
        status: "ordered",
        ordered_at: new Date(orderedAt).toISOString(),
      })
      .eq("id", submissionId);
  },

  receiveOrderLine: async (submissionId, itemId) => {
    const sub = get().submissions.find((s) => s.id === submissionId);
    if (!sub) return;
    const line = sub.orders.find((o) => o.itemId === itemId);
    if (!line || line.received) return;
    const newOrders = sub.orders.map((o) =>
      o.itemId === itemId ? { ...o, received: true } : o
    );
    const newStock = { ...sub.stock, [itemId]: (sub.stock[itemId] ?? 0) + line.orderQty };
    const allReceived = newOrders.every((o) => o.received);
    const newStatus = allReceived ? "completed" : "ordered";
    set((s) => ({
      submissions: s.submissions.map((x) =>
        x.id === submissionId
          ? { ...x, orders: newOrders, stock: newStock, status: newStatus }
          : x
      ),
    }));
    await supabase
      .from("submissions")
      .update({
        orders: newOrders as any,
        stock: newStock,
        status: newStatus,
      })
      .eq("id", submissionId);
  },
}));

/** 자동 추천: 안전재고 - 현재재고 (>0) */
export function recommendOrderQty(stock: number, safety: number): number {
  const diff = safety - stock;
  return diff > 0 ? Math.ceil(diff) : 0;
}
