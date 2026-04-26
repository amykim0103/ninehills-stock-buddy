import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, Item, Submission, CategoryKey, OrderLine, ItemType } from "./types";
import { buildSeedItems } from "./seedItems";
import { getSundayOfWeek } from "./utils-date";

interface Store extends AppState {
  // items
  addItem: (name: string, category: CategoryKey, safetyStock: number, type?: ItemType) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  toggleActive: (id: string) => void;
  /** 한 카테고리 내에서 itemId 배열 순서대로 sortOrder 재할당 */
  reorderItems: (category: CategoryKey, orderedIds: string[]) => void;

  // submissions
  ensureCurrentSubmission: () => string;
  getSubmission: (id: string) => Submission | undefined;
  getCurrentSubmission: () => Submission | undefined;
  saveStockEntry: (
    submissionId: string,
    stock: Record<string, number>,
    needOrderFlags: Record<string, boolean>,
    itemMemos: Record<string, string>,
    generalMemo: string
  ) => void;
  saveOrders: (submissionId: string, orders: OrderLine[]) => void;
  receiveOrderLine: (submissionId: string, itemId: string) => void;

  resetAll: () => void;
}

const initial: AppState = {
  items: buildSeedItems(),
  submissions: [],
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,

      addItem: (name, category, safetyStock, type = "quantity") =>
        set((s) => {
          const maxOrder = s.items
            .filter((i) => i.category === category)
            .reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1);
          return {
            items: [
              ...s.items,
              {
                id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: name.trim(),
                category,
                safetyStock,
                active: true,
                createdAt: Date.now(),
                type,
                sortOrder: maxOrder + 1,
              },
            ],
          };
        }),

      updateItem: (id, patch) =>
        set((s) => {
          const target = s.items.find((i) => i.id === id);
          if (!target) return s;
          // 카테고리가 변경되면 새 카테고리 맨 끝으로 이동
          const movingCategory =
            patch.category !== undefined && patch.category !== target.category;
          const newSortOrder = movingCategory
            ? s.items
                .filter((i) => i.category === patch.category)
                .reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1) + 1
            : target.sortOrder;
          return {
            items: s.items.map((i) =>
              i.id === id ? { ...i, ...patch, sortOrder: newSortOrder } : i
            ),
          };
        }),

      toggleActive: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, active: !i.active } : i)),
        })),

      reorderItems: (category, orderedIds) =>
        set((s) => {
          const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
          return {
            items: s.items.map((i) =>
              i.category === category && orderMap.has(i.id)
                ? { ...i, sortOrder: orderMap.get(i.id)! }
                : i
            ),
          };
        }),

      ensureCurrentSubmission: () => {
        const weekDate = getSundayOfWeek();
        const existing = get().submissions.find((s) => s.weekDate === weekDate);
        if (existing) return existing.id;
        const sub: Submission = {
          id: `sub-${Date.now()}`,
          weekDate,
          createdAt: Date.now(),
          stock: {},
          needOrderFlags: {},
          itemMemos: {},
          generalMemo: "",
          status: "stocked",
          orders: [],
        };
        set((s) => ({ submissions: [...s.submissions, sub] }));
        return sub.id;
      },

      getSubmission: (id) => get().submissions.find((s) => s.id === id),

      getCurrentSubmission: () => {
        const weekDate = getSundayOfWeek();
        return get().submissions.find((s) => s.weekDate === weekDate);
      },

      saveStockEntry: (submissionId, stock, needOrderFlags, itemMemos, generalMemo) =>
        set((s) => ({
          submissions: s.submissions.map((sub) =>
            sub.id === submissionId
              ? { ...sub, stock, needOrderFlags, itemMemos, generalMemo, status: "stocked" }
              : sub
          ),
        })),

      saveOrders: (submissionId, orders) =>
        set((s) => ({
          submissions: s.submissions.map((sub) =>
            sub.id === submissionId
              ? { ...sub, orders, status: "ordered", orderedAt: Date.now() }
              : sub
          ),
        })),

      receiveOrderLine: (submissionId, itemId) => {
        const sub = get().submissions.find((s) => s.id === submissionId);
        if (!sub) return;
        const line = sub.orders.find((o) => o.itemId === itemId);
        if (!line || line.received) return;
        const newOrders = sub.orders.map((o) =>
          o.itemId === itemId ? { ...o, received: true } : o
        );
        const newStock = { ...sub.stock, [itemId]: (sub.stock[itemId] ?? 0) + line.orderQty };
        const allReceived = newOrders.every((o) => o.received);
        set((s) => ({
          submissions: s.submissions.map((x) =>
            x.id === submissionId
              ? {
                  ...x,
                  orders: newOrders,
                  stock: newStock,
                  status: allReceived ? "completed" : "ordered",
                }
              : x
          ),
        }));
      },

      resetAll: () => set({ ...initial }),
    }),
    {
      name: "ninehill-inventory-v1",
      version: 2,
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        // v1 -> v2: Item.type, Submission.needOrderFlags 추가
        if (version < 2) {
          if (Array.isArray(persisted.items)) {
            persisted.items = persisted.items.map((it: any) => ({
              ...it,
              type: it.type ?? "quantity",
            }));
          }
          if (Array.isArray(persisted.submissions)) {
            persisted.submissions = persisted.submissions.map((sub: any) => ({
              ...sub,
              needOrderFlags: sub.needOrderFlags ?? {},
            }));
          }
        }
        return persisted;
      },
    }
  )
);

/** 자동 추천: 안전재고 - 현재재고 (>0) */
export function recommendOrderQty(stock: number, safety: number): number {
  const diff = safety - stock;
  return diff > 0 ? Math.ceil(diff) : 0;
}
