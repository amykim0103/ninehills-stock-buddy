import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, Item, Submission, CategoryKey, OrderLine } from "./types";
import { buildSeedItems } from "./seedItems";
import { getSundayOfWeek } from "./utils-date";

interface Store extends AppState {
  // auth
  setManagerPin: (pin: string) => void;
  setOwnerPassword: (pw: string) => void;

  // items
  addItem: (name: string, category: CategoryKey, safetyStock: number) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  toggleActive: (id: string) => void;

  // submissions
  /** 이번 주 일요일 기준 제출이 없으면 생성하고 id 반환, 있으면 기존 id */
  ensureCurrentSubmission: () => string;
  getSubmission: (id: string) => Submission | undefined;
  getCurrentSubmission: () => Submission | undefined;
  saveStockEntry: (
    submissionId: string,
    stock: Record<string, number>,
    itemMemos: Record<string, string>,
    generalMemo: string
  ) => void;
  saveOrders: (submissionId: string, orders: OrderLine[]) => void;
  receiveOrderLine: (submissionId: string, itemId: string) => void;

  resetAll: () => void;
}

const initial: AppState = {
  managerPin: "1234",
  ownerPassword: "0000",
  items: buildSeedItems(),
  submissions: [],
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,

      setManagerPin: (pin) => set({ managerPin: pin }),
      setOwnerPassword: (pw) => set({ ownerPassword: pw }),

      addItem: (name, category, safetyStock) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: name.trim(),
              category,
              safetyStock,
              active: true,
              createdAt: Date.now(),
            },
          ],
        })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      toggleActive: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, active: !i.active } : i)),
        })),

      ensureCurrentSubmission: () => {
        const weekDate = getSundayOfWeek();
        const existing = get().submissions.find((s) => s.weekDate === weekDate);
        if (existing) return existing.id;
        const sub: Submission = {
          id: `sub-${Date.now()}`,
          weekDate,
          createdAt: Date.now(),
          stock: {},
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

      saveStockEntry: (submissionId, stock, itemMemos, generalMemo) =>
        set((s) => ({
          submissions: s.submissions.map((sub) =>
            sub.id === submissionId
              ? { ...sub, stock, itemMemos, generalMemo, status: "stocked" }
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
    }
  )
);

/** 자동 추천: 안전재고 - 현재재고 (>0) */
export function recommendOrderQty(stock: number, safety: number): number {
  const diff = safety - stock;
  return diff > 0 ? Math.ceil(diff) : 0;
}
