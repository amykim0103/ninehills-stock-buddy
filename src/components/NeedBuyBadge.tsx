import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export function NeedBuyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground",
        className
      )}
    >
      <AlertCircle className="w-3 h-3" />
      구매필요
    </span>
  );
}
