import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { useUpdateLinkMutation } from "../../hooks/useLinks";
import { formatInputDateTime } from "../../utils/format";

export function EditLinkModal({ open, onClose, link }) {
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isActive, setIsActive] = useState(true);
  const updateLinkMutation = useUpdateLinkMutation();

  useEffect(() => {
    if (!link) {
      return;
    }

    setTitle(link.title || "");
    setExpiry(formatInputDateTime(link.expiry));
    setIsActive(Boolean(link.isActive));
  }, [link]);

  if (!link) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (expiry) {
      const parsed = new Date(expiry);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        toast.error("Expiry must be a valid future date.");
        return;
      }
    }

    try {
      await updateLinkMutation.mutateAsync({
        code: link.code,
        payload: {
          title: title.trim(),
          expiry: expiry || null,
          isActive
        }
      });

      toast.success("Link updated.");
      onClose();
    } catch (_error) {
      toast.error("We couldn't save your changes right now.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={`Edit ${link.code}`}
      description="Update the title, expiry, and active status for this link."
      footer={(
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="ghost" className="sm:flex-1" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="edit-link-form"
            className="w-full justify-center font-display uppercase tracking-[0.08em] sm:flex-1"
            loading={updateLinkMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      )}
    >
      <form id="edit-link-form" className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Short URL" description="Read-only once created.">
          <Input value={link.shortUrl} readOnly />
        </Field>
        <Field label="Destination URL" description="Locked after creation.">
          <Input value={link.longUrl} readOnly />
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Link title" />
        </Field>
        <Field label="Expiry" description="Clear the field if you want the link to stay active without an end date.">
          <Input type="datetime-local" value={expiry} onChange={(event) => setExpiry(event.target.value)} />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-borderDefault bg-panelAlt px-4 py-4">
          <div>
            <p className="text-sm font-medium text-ink">Active status</p>
            <p className="mt-2 text-xs leading-6 text-ink opacity-80">Inactive links stop redirecting until you turn them back on.</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </form>
    </Dialog>
  );
}
