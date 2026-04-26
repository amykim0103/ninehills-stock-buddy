export type CategoryKey =
  | "시럽"
  | "파우더&소스류"
  | "냉동"
  | "티백류"
  | "원액+액체류"
  | "청유"
  | "페이스트"
  | "데코용"
  | "소모품";

export const CATEGORIES: CategoryKey[] = [
  "시럽",
  "파우더&소스류",
  "냉동",
  "티백류",
  "원액+액체류",
  "청유",
  "페이스트",
  "데코용",
  "소모품",
];

export interface Item {
  id: string;
  name: string;
  category: CategoryKey;
  safetyStock: number;
  active: boolean;
  createdAt: number;
}

export type SubmissionStatus = "stocked" | "ordered" | "completed";

export interface OrderLine {
  itemId: string;
  orderQty: number;
  received: boolean;
}

export interface Submission {
  id: string;
  /** 일요일 날짜 ISO (YYYY-MM-DD) */
  weekDate: string;
  createdAt: number;
  /** itemId -> qty */
  stock: Record<string, number>;
  /** itemId -> memo */
  itemMemos: Record<string, string>;
  /** 제출 메모 */
  generalMemo: string;
  status: SubmissionStatus;
  orders: OrderLine[];
  orderedAt?: number;
}

export interface AppState {
  items: Item[];
  submissions: Submission[];
}
