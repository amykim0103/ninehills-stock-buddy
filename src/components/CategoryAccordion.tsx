import { useMemo } from "react";
import { CategoryKey, CATEGORIES, Item } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  items: Item[];
  renderItem: (item: Item) => React.ReactNode;
  /** 카테고리별 부가 카운트(예: 구매필요 수) */
  badgeFor?: (cat: CategoryKey, items: Item[]) => React.ReactNode;
  defaultOpen?: CategoryKey[];
}

export default function CategoryAccordion({ items, renderItem, badgeFor, defaultOpen }: Props) {
  const grouped = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const c of CATEGORIES) map[c] = [];
    for (const i of items) map[i.category]?.push(i);
    return map;
  }, [items]);

  const initial = defaultOpen ?? CATEGORIES.filter((c) => grouped[c].length > 0).slice(0, 1);

  return (
    <Accordion type="multiple" defaultValue={initial} className="space-y-3">
      {CATEGORIES.map((cat) => {
        const list = grouped[cat];
        if (list.length === 0) return null;
        return (
          <AccordionItem
            key={cat}
            value={cat}
            className="card-warm border-0 px-4 overflow-hidden"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-base font-semibold text-primary">{cat}</span>
                <span className="text-xs text-muted-foreground">{list.length}</span>
                <div className="ml-auto mr-2">{badgeFor?.(cat, list)}</div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">{list.map(renderItem)}</div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
