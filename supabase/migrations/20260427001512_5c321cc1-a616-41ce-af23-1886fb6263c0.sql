
-- ========== Items (재고 품목) ==========
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL DEFAULT 'quantity',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========== Submissions (주차별 재고 제출) ==========
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_date DATE NOT NULL UNIQUE,
  stock JSONB NOT NULL DEFAULT '{}'::jsonb,
  need_order_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  item_memos JSONB NOT NULL DEFAULT '{}'::jsonb,
  general_memo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'stocked',
  orders JSONB NOT NULL DEFAULT '[]'::jsonb,
  ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========== Recipes (레시피) ==========
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- variants는 ingredients까지 모두 포함하는 JSON 구조 (편집 단위가 카드 전체이므로 단순화)
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER items_touch BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER submissions_touch BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER recipes_touch BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS: 매장 내부 공용 데이터 (앱 자체에 비밀번호 보호 있음). 익명 포함 모든 사용자에게 전체 권한 부여.
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Public write items" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update items" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Public delete items" ON public.items FOR DELETE USING (true);

CREATE POLICY "Public read submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Public write submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update submissions" ON public.submissions FOR UPDATE USING (true);
CREATE POLICY "Public delete submissions" ON public.submissions FOR DELETE USING (true);

CREATE POLICY "Public read recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Public write recipes" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update recipes" ON public.recipes FOR UPDATE USING (true);
CREATE POLICY "Public delete recipes" ON public.recipes FOR DELETE USING (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;

-- 인덱스
CREATE INDEX idx_items_category_sort ON public.items(category, sort_order);
CREATE INDEX idx_recipes_category_sort ON public.recipes(category, sort_order);
CREATE INDEX idx_submissions_week ON public.submissions(week_date DESC);
