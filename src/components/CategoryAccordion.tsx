import { useMemo } from "react";
import { CategoryKey, CATEGORIES, Item } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Props {
  items: Item[];
  renderItem: (item: Item) => React.ReactNode;
  /** 카테고리별 부가 카운트(예: 구매필요 수) */
  badgeFor?: (cat: CategoryKey, items: Item[]) => React.ReactNode;
  defaultOpen?: CategoryKey[];
  /** 드래그 앤 드롭으로 카테고리 내 순서 변경 활성화 */
  sortable?: boolean;
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-1.5">
      <button
        type="button"
        aria-label="순서 변경 핸들"
        className="flex items-center justify-center w-7 shrink-0 rounded-lg text-muted-foreground hover:bg-secondary touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function SortableCategoryList({
  cat,
  list,
  renderItem,
}: {
  cat: CategoryKey;
  list: Item[];
  renderItem: (item: Item) => React.ReactNode;
}) {
  const reorderItems = useStore((s) => s.reorderItems);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = list.findIndex((i) => i.id === active.id);
    const newIndex = list.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(list, oldIndex, newIndex).map((i) => i.id);
    reorderItems(cat, newOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={list.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {list.map((it) => (
            <SortableRow key={it.id} id={it.id}>
              {renderItem(it)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default function CategoryAccordion({
  items,
  renderItem,
  badgeFor,
  defaultOpen,
  sortable = false,
}: Props) {
  const grouped = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const c of CATEGORIES) map[c] = [];
    for (const i of items) map[i.category]?.push(i);
    // 카테고리 내 sortOrder 기준 정렬 (동일 시 createdAt)
    for (const c of CATEGORIES) {
      map[c].sort((a, b) => {
        const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (so !== 0) return so;
        return (a.createdAt ?? 0) - (b.createdAt ?? 0);
      });
    }
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
              {sortable ? (
                <SortableCategoryList cat={cat} list={list} renderItem={renderItem} />
              ) : (
                <div className="space-y-2">{list.map(renderItem)}</div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
