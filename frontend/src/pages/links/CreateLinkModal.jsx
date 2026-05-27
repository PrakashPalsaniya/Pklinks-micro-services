import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { useClipboard } from "../../hooks/useClipboard";
import { useCreateLinkMutation } from "../../hooks/useLinks";
import { isValidHttpUrlInput } from "../../utils/urlValidation";

const emptyForm = {
  longUrl: "",
  title: "",
  customAlias: "",
  expiry: ""
};

const aliasPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_]{2,39}$/;

export function CreateLinkModal({ open, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const { copy } = useClipboard();
  const createLinkMutation = useCreateLinkMutation();

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [open]);

  const aliasHint = useMemo(() => {
    if (!form.customAlias.trim()) {
      return "Leave blank to generate a short code automatically.";
    }

    return aliasPattern.test(form.customAlias.trim())
      ? "Looks good."
      : "3-40 characters. Use letters, numbers, hyphens, or underscores.";
  }, [form.customAlias]);

  const validate = () => {
    const nextErrors = {};

    if (!form.longUrl.trim()) {
      nextErrors.longUrl = "Long URL is required.";
    } else if (!isValidHttpUrlInput(form.longUrl)) {
      nextErrors.longUrl = "Please enter a valid URL including http:// or https://";
    }

    if (form.customAlias.trim() && !aliasPattern.test(form.customAlias.trim())) {
      nextErrors.customAlias = "Use only letters, numbers, hyphens, or underscores.";
    }

    if (form.expiry) {
      const parsed = new Date(form.expiry);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        nextErrors.expiry = "Expiry must be a valid future date.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const payload = {
        longUrl: form.longUrl.trim(),
        title: form.title.trim() || undefined,
        customAlias: form.customAlias.trim() || undefined,
        expiry: form.expiry || undefined
      };

      const created = await createLinkMutation.mutateAsync(payload);
      toast.success("Link created.");
      await copy(created.shortUrl, "Short URL copied.");
      onClose();
    } catch (_error) {
      toast.error("We couldn't create the link right now.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Create link"
      description="Add a destination, an optional title, and a custom alias if you want one."
      footer={(
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="ghost" className="sm:flex-1" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="create-link-form"
            className="w-full justify-center font-display uppercase tracking-[0.08em] sm:flex-1"
            loading={createLinkMutation.isPending}
          >
            Create link
          </Button>
        </div>
      )}
    >
      <form id="create-link-form" className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Long URL" error={errors.longUrl}>
          <Input
            placeholder="https://example.com/product-launch"
            value={form.longUrl}
            onChange={(event) => setForm((current) => ({ ...current, longUrl: event.target.value }))}
          />
        </Field>
        <Field label="Title">
          <Input
            placeholder="Spring campaign landing page"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </Field>
        <Field label="Custom alias" error={errors.customAlias} description={aliasHint}>
          <Input
            placeholder="spring-launch"
            value={form.customAlias}
            onChange={(event) => setForm((current) => ({ ...current, customAlias: event.target.value }))}
          />
        </Field>
        <Field label="Expiry" error={errors.expiry} description="Optional. After this time, the link stops redirecting.">
          <Input
            type="datetime-local"
            value={form.expiry}
            onChange={(event) => setForm((current) => ({ ...current, expiry: event.target.value }))}
          />
        </Field>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs font-medium leading-relaxed text-secondary italic">
          Links created here drop straight into the dashboard and copy themselves to your clipboard.
        </div>
      </form>
    </Dialog>
  );
}
