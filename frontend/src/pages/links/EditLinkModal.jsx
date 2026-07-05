import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { useUpdateLinkMutation } from "../../hooks/useLinks";
import { formatInputDateTime } from "../../utils/format";

const editLinkSchema = z.object({
  title: z.string().optional(),
  expiry: z.string().optional().refine((val) => {
    if (!val) return true;
    const parsed = new Date(val);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
  }, "Expiry must be a valid future date."),
  isActive: z.boolean(),
});

export function EditLinkModal({ open, onClose, link }) {
  const updateLinkMutation = useUpdateLinkMutation();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(editLinkSchema),
    defaultValues: { title: "", expiry: "", isActive: true }
  });

  const isActiveValue = watch("isActive");

  useEffect(() => {
    if (link) {
      reset({
        title: link.title || "",
        expiry: formatInputDateTime(link.expiry) || "",
        isActive: Boolean(link.isActive)
      });
    }
  }, [link, reset]);

  if (!link) {
    return null;
  }

  const onSubmit = async (data) => {
    try {
      await updateLinkMutation.mutateAsync({
        code: link.code,
        payload: {
          title: data.title?.trim() || undefined,
          expiry: data.expiry || null,
          isActive: data.isActive
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
      <form id="edit-link-form" className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Short URL" description="Read-only once created.">
          <Input value={link.shortUrl} readOnly />
        </Field>
        <Field label="Destination URL" description="Locked after creation.">
          <Input value={link.longUrl} readOnly />
        </Field>
        <Field label="Title" error={errors.title?.message}>
          <Input {...register("title")} placeholder="Link title" />
        </Field>
        <Field label="Expiry" error={errors.expiry?.message} description="Clear the field if you want the link to stay active without an end date.">
          <Input type="datetime-local" {...register("expiry")} />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-borderDefault bg-panelAlt px-4 py-4">
          <div>
            <p className="text-sm font-medium text-ink">Active status</p>
            <p className="mt-2 text-xs leading-6 text-ink opacity-80">Inactive links stop redirecting until you turn them back on.</p>
          </div>
          <Switch checked={isActiveValue} onCheckedChange={(val) => setValue("isActive", val)} />
        </div>
      </form>
    </Dialog>
  );
}
