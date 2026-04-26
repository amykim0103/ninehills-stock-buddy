import { useState } from "react";
import { Recipe, RecipeVariant, RECIPE_CATEGORIES } from "@/lib/recipeTypes";
import { useRecipeStore, newIngredient, newVariant } from "@/lib/recipeStore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, Snowflake, Flame, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: Recipe;
  editing: boolean;
  onRequestEdit: () => void;
  onExitEdit: () => void;
}

function TempBadge({ variants }: { variants: RecipeVariant[] }) {
  const hasIce = variants.some((v) => v.temp === "ice");
  const hasHot = variants.some((v) => v.temp === "hot");
  if (hasIce && hasHot) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium">
        <Snowflake className="w-3 h-3" />
        <span>+</span>
        <Flame className="w-3 h-3" />
      </span>
    );
  }
  if (hasIce) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(200_60%_92%)] text-[hsl(210_60%_30%)] text-[10px] font-medium">
        <Snowflake className="w-3 h-3" /> ICE
      </span>
    );
  }
  if (hasHot) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(14_70%_92%)] text-destructive text-[10px] font-medium">
        <Flame className="w-3 h-3" /> HOT
      </span>
    );
  }
  return null;
}

function VariantView({ variant, multiple }: { variant: RecipeVariant; multiple: boolean }) {
  return (
    <div className="space-y-1.5">
      {multiple && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {variant.temp === "ice" ? (
            <>
              <Snowflake className="w-3 h-3" /> Ice
            </>
          ) : (
            <>
              <Flame className="w-3 h-3" /> Hot
            </>
          )}
        </div>
      )}
      <ul className="divide-y divide-border/40">
        {variant.ingredients.map((ing) => (
          <li
            key={ing.id}
            className="flex items-baseline justify-between gap-3 py-1.5"
          >
            <span className="text-sm text-foreground">{ing.name || "—"}</span>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {ing.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VariantEditor({
  variant,
  onChange,
  onRemove,
  canRemove,
}: {
  variant: RecipeVariant;
  onChange: (next: RecipeVariant) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const updateIng = (idx: number, patch: Partial<RecipeVariant["ingredients"][number]>) => {
    onChange({
      ...variant,
      ingredients: variant.ingredients.map((ing, i) =>
        i === idx ? { ...ing, ...patch } : ing
      ),
    });
  };
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Select
          value={variant.temp}
          onValueChange={(v: "ice" | "hot") => onChange({ ...variant, temp: v })}
        >
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ice">ICE</SelectItem>
            <SelectItem value="hot">HOT</SelectItem>
          </SelectContent>
        </Select>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <X className="w-3.5 h-3.5" /> 변형 삭제
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        {variant.ingredients.map((ing, idx) => (
          <div key={ing.id} className="flex items-center gap-1.5">
            <Input
              value={ing.name}
              placeholder="재료명"
              className="h-9 flex-1"
              onChange={(e) => updateIng(idx, { name: e.target.value })}
            />
            <Input
              value={ing.amount}
              placeholder="양"
              className="h-9 w-24"
              onChange={(e) => updateIng(idx, { amount: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={() =>
                onChange({
                  ...variant,
                  ingredients: variant.ingredients.filter((_, i) => i !== idx),
                })
              }
              disabled={variant.ingredients.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-full"
        onClick={() =>
          onChange({ ...variant, ingredients: [...variant.ingredients, newIngredient()] })
        }
      >
        <Plus className="w-3.5 h-3.5" /> 재료 추가
      </Button>
    </div>
  );
}

export default function RecipeCard({
  recipe,
  editing,
  onRequestEdit,
  onExitEdit,
}: Props) {
  const toggleActive = useRecipeStore((s) => s.toggleActive);
  const updateRecipe = useRecipeStore((s) => s.updateRecipe);
  const setVariants = useRecipeStore((s) => s.setVariants);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);

  // 편집 중인 로컬 상태
  const [draftName, setDraftName] = useState(recipe.name);
  const [draftCategory, setDraftCategory] = useState(recipe.category);
  const [draftVariants, setDraftVariants] = useState<RecipeVariant[]>(recipe.variants);

  const enterEdit = () => {
    setDraftName(recipe.name);
    setDraftCategory(recipe.category);
    setDraftVariants(recipe.variants);
    onRequestEdit();
  };

  const save = () => {
    updateRecipe(recipe.id, {
      name: draftName.trim() || recipe.name,
      category: draftCategory,
    });
    setVariants(recipe.id, draftVariants);
    onExitEdit();
  };

  const inactive = !recipe.active;

  if (editing) {
    return (
      <article className="rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-card space-y-3">
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            메뉴명
          </label>
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="h-10 text-base font-semibold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            카테고리
          </label>
          <Select
            value={draftCategory}
            onValueChange={(v) => setDraftCategory(v as typeof draftCategory)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECIPE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              레시피 변형 (ICE / HOT)
            </label>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={draftVariants.length >= 2}
              onClick={() => {
                const nextTemp =
                  draftVariants.some((v) => v.temp === "ice") ? "hot" : "ice";
                setDraftVariants([...draftVariants, newVariant(nextTemp)]);
              }}
            >
              <Plus className="w-3 h-3" /> 변형 추가
            </Button>
          </div>
          {draftVariants.map((v, idx) => (
            <VariantEditor
              key={v.id}
              variant={v}
              canRemove={draftVariants.length > 1}
              onChange={(next) =>
                setDraftVariants(draftVariants.map((x, i) => (i === idx ? next : x)))
              }
              onRemove={() =>
                setDraftVariants(draftVariants.filter((_, i) => i !== idx))
              }
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("이 레시피를 삭제할까요?")) {
                deleteRecipe(recipe.id);
                onExitEdit();
              }
            }}
          >
            <Trash2 className="w-4 h-4" /> 삭제
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExitEdit}>
              취소
            </Button>
            <Button size="sm" onClick={save}>
              <Check className="w-4 h-4" /> 저장
            </Button>
          </div>
        </div>
      </article>
    );
  }

  const multiple = recipe.variants.length > 1;

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-opacity",
        inactive && "opacity-60"
      )}
    >
      <header className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold leading-tight">{recipe.name}</h3>
          <TempBadge variants={recipe.variants} />
          {inactive && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold tracking-wider">
              판매중지
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={enterEdit}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="수정"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <Switch
            checked={recipe.active}
            onCheckedChange={() => toggleActive(recipe.id)}
            aria-label="판매 중"
          />
        </div>
      </header>

      <div className="space-y-3">
        {recipe.variants.map((v) => (
          <VariantView key={v.id} variant={v} multiple={multiple} />
        ))}
      </div>
    </article>
  );
}
