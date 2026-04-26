export const RECIPE_CATEGORIES = [
  "Signature",
  "Coffee",
  "Non Cafe",
  "Tea",
  "Herb Tea",
  "Ade",
  "Dessert",
  "Juice",
  "Smoothie",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;
}

/** 한 메뉴 내 변형(아이스/핫). 둘 다 가능한 메뉴는 두 variant를 가진다. */
export interface RecipeVariant {
  id: string;
  /** "ice" | "hot" */
  temp: "ice" | "hot";
  ingredients: RecipeIngredient[];
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  variants: RecipeVariant[];
  /** 판매중지 여부 (false = 판매중지) */
  active: boolean;
  sortOrder: number;
}
