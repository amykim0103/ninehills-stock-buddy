import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecipeStore } from "@/lib/recipeStore";
import { RECIPE_CATEGORIES, RecipeCategory } from "@/lib/recipeTypes";
import RecipeCard from "@/components/RecipeCard";
import PasswordDialog from "@/components/PasswordDialog";
import { Button } from "@/components/ui/button";

const TABS = ["전체", ...RECIPE_CATEGORIES] as const;
type TabKey = (typeof TABS)[number];

export default function Recipes() {
  const [active, setActive] = useState<TabKey>("전체");
  const recipes = useRecipeStore((s) => s.recipes);
  const addRecipe = useRecipeStore((s) => s.addRecipe);

  // 비번 다이얼로그 + 어떤 작업을 인증할지
  const [pwOpen, setPwOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);

  // 현재 편집 중인 레시피 id
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = active === "전체" ? recipes : recipes.filter((r) => r.category === active);
    // active(true) 우선, 그 안에서 sortOrder 오름차순. 비활성은 맨 뒤로.
    return [...list].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [recipes, active]);

  const requestPassword = (action: () => void) => {
    setPendingAction(() => action);
    setPwOpen(true);
  };

  const handleAdd = () => {
    requestPassword(() => {
      const targetCategory: RecipeCategory =
        active === "전체" ? "Signature" : (active as RecipeCategory);
      const id = addRecipe(targetCategory);
      setEditingId(id);
      if (active === "전체") setActive(targetCategory);
    });
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto pb-10">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="flex items-center gap-2 px-5 py-4">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="뒤로"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-coffee flex items-center justify-center shadow-soft">
            <Coffee className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Ninehill
            </div>
            <div className="text-base font-semibold leading-tight">레시피</div>
          </div>
          <Button size="sm" variant="outline" onClick={handleAdd} className="h-8">
            <Plus className="w-3.5 h-3.5" /> 추가
          </Button>
        </div>

        {/* 상단 페이지 탭 */}
        <div className="flex px-5 gap-1 border-b border-border/60">
          <Link
            to="/"
            className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            재고현황
          </Link>
          <div className="px-3 py-2.5 text-sm font-semibold text-foreground border-b-2 border-primary -mb-px">
            레시피
          </div>
        </div>

        {/* 카테고리 가로 스크롤 */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex gap-2 px-5 py-3 min-w-max">
            {TABS.map((c) => {
              const isActive = c === active;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Coffee className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              아직 등록된 레시피가 없습니다
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              상단 추가 버튼으로 새 레시피를 만들어 보세요
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                editing={editingId === r.id}
                onRequestEdit={() =>
                  requestPassword(() => setEditingId(r.id))
                }
                onExitEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </main>

      <PasswordDialog
        open={pwOpen}
        onOpenChange={setPwOpen}
        onSuccess={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
      />
    </div>
  );
}
