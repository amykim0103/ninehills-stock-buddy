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

/**
 * quantity: 수량 입력형 (안전재고와 비교)
 * needOrder: 주문필요 토글형 (수량 없음, 토글로만 표시)
 */
export type ItemType = "quantity" | "needOrder";

export interface Item {
  id: string;
  name: string;
  category: CategoryKey;
  safetyStock: number;
  active: boolean;
  createdAt: number;
  type: ItemType;
  /** 카테고리 내 정렬 순서 (작을수록 위) */
  sortOrder: number;
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
  /** itemId -> qty (수량형 품목만) */
  stock: Record<string, number>;
  /** itemId -> 주문필요 여부 (주문필요형 품목만) */
  needOrderFlags: Record<string, boolean>;
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
