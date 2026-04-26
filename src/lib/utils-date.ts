/** 주어진 날짜가 속한 주의 일요일(YYYY-MM-DD)을 반환 */
export function getSundayOfWeek(d: Date = new Date()): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0=일
  date.setDate(date.getDate() - day);
  return toISODate(date);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${y}년 ${m}월 ${d}일 (${days[date.getDay()]})`;
}

export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}

/** 수량 입력 정규화: 1 미만은 소수, 1 이상은 정수 */
export function normalizeQty(raw: string | number): number {
  const n = typeof raw === "number" ? raw : parseFloat(raw);
  if (isNaN(n) || n < 0) return 0;
  if (n < 1) return Math.round(n * 10) / 10; // 0.1 단위
  return Math.floor(n);
}

export function formatQty(n: number): string {
  if (n === 0) return "0";
  if (n < 1) return n.toString();
  return Math.floor(n).toString();
}
