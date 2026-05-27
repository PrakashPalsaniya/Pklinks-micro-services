import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  tone = "danger"
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={(
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      )}
    >
      <div className="rounded-lg border border-borderDefault bg-elevated p-4 text-sm font-medium leading-6 text-ink">
        Your change will show up in a moment.
      </div>
    </Dialog>
  );
}
