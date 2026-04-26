import { useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "전체",
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

type RecipeCategory = (typeof CATEGORIES)[number];

interface Recipe {
  id: string;
  name: string;
  category: Exclude<RecipeCategory, "전체">;
  ingredients: string[];
}

// 추후 데이터 추가 위치
const RECIPES: Recipe[] = [];

export default function Recipes() {
  const [active, setActive] = useState<RecipeCategory>("전체");

  const filtered =
    active === "전체" ? RECIPES : RECIPES.filter((r) => r.category === active);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
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
          <div>
            <div className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Ninehill
            </div>
            <div className="text-base font-semibold leading-tight">레시피</div>
          </div>
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
            {CATEGORIES.map((c) => {
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
              {active === "전체" ? "" : `${active} 카테고리`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold leading-tight">
                    {r.name}
                  </h3>
                  <span className="text-[10px] tracking-wider uppercase text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                    {r.category}
                  </span>
                </div>
                {r.ingredients.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
