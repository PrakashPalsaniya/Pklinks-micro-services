import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { useClipboard } from "../../hooks/useClipboard";
import { useCreateLinkMutation } from "../../hooks/useLinks";

const aliasPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/;

const createLinkSchema = z.object({
  longUrl: z.string().url("Please enter a valid URL including http:// or https://"),
  title: z.string().optional(),
  customAlias: z.string()
    .min(3, "3-40 characters.")
    .max(40, "3-40 characters.")
    .regex(aliasPattern, "Use only letters, numbers, hyphens, or underscores.")
    .optional()
    .or(z.literal('')),
  expiry: z.string().optional().refine((val) => {
    if (!val) return true;
    const parsed = new Date(val);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
  }, "Expiry must be a valid future date."),
});

export function CreateLinkModal({ open, onClose }) {
  const { copy } = useClipboard();
  const createLinkMutation = useCreateLinkMutation();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(createLinkSchema),
    defaultValues: { longUrl: "", title: "", customAlias: "", expiry: "" }
  });

  const customAliasValue = watch("customAlias");

  useEffect(() => {
    if (!open) {
      reset({ longUrl: "", title: "", customAlias: "", expiry: "" });
    }
  }, [open, reset]);

  const aliasHint = useMemo(() => {
    if (!customAliasValue || !customAliasValue.trim()) {
      return "Leave blank to generate a short code automatically.";
    }

    return aliasPattern.test(customAliasValue.trim()) && customAliasValue.trim().length >= 3
      ? "Looks good."
      : "3-40 characters. Use letters, numbers, hyphens, or underscores.";
  }, [customAliasValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        longUrl: data.longUrl.trim(),
        title: data.title?.trim() || undefined,
        customAlias: data.customAlias?.trim() || undefined,
        expiry: data.expiry || undefined
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
      <form id="create-link-form" className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Long URL" error={errors.longUrl?.message}>
          <Input
            placeholder="https://example.com/product-launch"
            {...register("longUrl")}
          />
        </Field>
        <Field label="Title" error={errors.title?.message}>
          <Input
            placeholder="Spring campaign landing page"
            {...register("title")}
          />
        </Field>
        <Field label="Custom alias" error={errors.customAlias?.message} description={aliasHint}>
          <Input
            placeholder="spring-launch"
            {...register("customAlias")}
          />
        </Field>
        <Field label="Expiry" error={errors.expiry?.message} description="Optional. After this time, the link stops redirecting.">
          <Input
            type="datetime-local"
            {...register("expiry")}
          />
        </Field>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs font-medium leading-relaxed text-secondary italic">
          Links created here drop straight into the dashboard and copy themselves to your clipboard.
        </div>
      </form>
    </Dialog>
  );
}
