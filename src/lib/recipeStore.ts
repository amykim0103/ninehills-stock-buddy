import { create } from "zustand";
import { Recipe, RecipeCategory, RecipeIngredient, RecipeVariant } from "./recipeTypes";
import { seedRecipes } from "./seedRecipes";
import { supabase } from "@/integrations/supabase/client";

const uid = (prefix = "id") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function rowToRecipe(r: any): Recipe {
  return {
    id: r.id,
    name: r.name,
    category: r.category as RecipeCategory,
    active: r.active,
    sortOrder: r.sort_order ?? 0,
    variants: (r.variants ?? []) as RecipeVariant[],
  };
}

interface RecipeStore {
  recipes: Recipe[];
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;

  toggleActive: (id: string) => Promise<void>;
  updateRecipe: (id: string, patch: Partial<Pick<Recipe, "name" | "category">>) => Promise<void>;
  setVariants: (id: string, variants: RecipeVariant[]) => Promise<void>;
  addRecipe: (category: RecipeCategory) => Promise<string>;
  deleteRecipe: (id: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeStore>()((set, get) => ({
  recipes: [],
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true, initialized: true });

    const { data } = await supabase.from("recipes").select("*");
    let recipes = (data ?? []).map(rowToRecipe);

    // DB가 비어있으면 시드 입력
    if (recipes.length === 0) {
      const seedRows = seedRecipes().map((r) => ({
        name: r.name,
        category: r.category,
        active: r.active,
        sort_order: r.sortOrder,
        variants: r.variants as any,
      }));
      const { data: inserted } = await supabase
        .from("recipes")
        .insert(seedRows)
        .select("*");
      recipes = (inserted ?? []).map(rowToRecipe);
    }

    set({ recipes, loading: false });

    // Realtime 구독
    supabase
      .channel("recipes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recipes" },
        (payload) => {
          set((s) => {
            if (payload.eventType === "DELETE") {
              return {
                recipes: s.recipes.filter(
                  (r) => r.id !== (payload.old as any).id
                ),
              };
            }
            const next = rowToRecipe(payload.new);
            const exists = s.recipes.some((r) => r.id === next.id);
            return {
              recipes: exists
                ? s.recipes.map((r) => (r.id === next.id ? next : r))
                : [...s.recipes, next],
            };
          });
        }
      )
      .subscribe();
  },

  toggleActive: async (id) => {
    const target = get().recipes.find((r) => r.id === id);
    if (!target) return;
    const next = !target.active;
    set((s) => ({
      recipes: s.recipes.map((r) => (r.id === id ? { ...r, active: next } : r)),
    }));
    await supabase.from("recipes").update({ active: next }).eq("id", id);
  },

  updateRecipe: async (id, patch) => {
    set((s) => ({
      recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    await supabase.from("recipes").update(dbPatch).eq("id", id);
  },

  setVariants: async (id, variants) => {
    set((s) => ({
      recipes: s.recipes.map((r) => (r.id === id ? { ...r, variants } : r)),
    }));
    await supabase
      .from("recipes")
      .update({ variants: variants as any })
      .eq("id", id);
  },

  addRecipe: async (category) => {
    const maxOrder = get()
      .recipes.filter((r) => r.category === category)
      .reduce((m, r) => Math.max(m, r.sortOrder ?? 0), -1);
    const newRow = {
      name: "새 메뉴",
      category,
      active: true,
      sort_order: maxOrder + 1,
      variants: [
        {
          id: uid("var"),
          temp: "ice",
          ingredients: [{ id: uid("ing"), name: "", amount: "" }],
        },
      ] as any,
    };
    const { data, error } = await supabase
      .from("recipes")
      .insert(newRow)
      .select("*")
      .single();
    if (error) throw error;
    const recipe = rowToRecipe(data);
    set((s) =>
      s.recipes.some((r) => r.id === recipe.id)
        ? s
        : { recipes: [...s.recipes, recipe] }
    );
    return recipe.id;
  },

  deleteRecipe: async (id) => {
    set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) }));
    await supabase.from("recipes").delete().eq("id", id);
  },
}));

export const newIngredient = (): RecipeIngredient => ({
  id: uid("ing"),
  name: "",
  amount: "",
});

export const newVariant = (temp: "ice" | "hot"): RecipeVariant => ({
  id: uid("var"),
  temp,
  ingredients: [newIngredient()],
});
