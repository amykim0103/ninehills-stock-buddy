import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Recipe, RecipeCategory, RecipeIngredient, RecipeVariant } from "./recipeTypes";
import { seedRecipes } from "./seedRecipes";

const uid = (prefix = "id") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

interface RecipeStore {
  recipes: Recipe[];
  toggleActive: (id: string) => void;
  updateRecipe: (id: string, patch: Partial<Pick<Recipe, "name" | "category">>) => void;
  setVariants: (id: string, variants: RecipeVariant[]) => void;
  addRecipe: (category: RecipeCategory) => string;
  deleteRecipe: (id: string) => void;
  resetRecipes: () => void;
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: seedRecipes(),

      toggleActive: (id) =>
        set((s) => ({
          recipes: s.recipes.map((r) =>
            r.id === id ? { ...r, active: !r.active } : r
          ),
        })),

      updateRecipe: (id, patch) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      setVariants: (id, variants) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, variants } : r)),
        })),

      addRecipe: (category) => {
        const id = uid("recipe");
        set((s) => {
          const maxOrder = s.recipes
            .filter((r) => r.category === category)
            .reduce((m, r) => Math.max(m, r.sortOrder ?? 0), -1);
          const newRecipe: Recipe = {
            id,
            name: "새 메뉴",
            category,
            active: true,
            sortOrder: maxOrder + 1,
            variants: [
              {
                id: uid("var"),
                temp: "ice",
                ingredients: [{ id: uid("ing"), name: "", amount: "" }],
              },
            ],
          };
          return { recipes: [...s.recipes, newRecipe] };
        });
        return id;
      },

      deleteRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),

      resetRecipes: () => set({ recipes: seedRecipes() }),
    }),
    {
      name: "ninehill-recipes-v1",
      version: 1,
    }
  )
);

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
