import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/Button";

export function PaginationControls({ page, totalPages, onPageChange, label = "items" }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-secondary">
        Page {page} of {totalPages} for {label}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button type="button" variant="ghost" size="sm" icon={ChevronLeft} disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <Button type="button" variant="ghost" size="sm" icon={ChevronRight} disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
