import { useCallback } from "react";
import { toast } from "sonner";

export const useClipboard = () => {
  const copy = useCallback(async (value, successMessage = "Copied to clipboard.") => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toast.success(successMessage);
      return true;
    } catch (_error) {
      toast.error("Could not copy right now.");
      return false;
    }
  }, []);

  return { copy };
};
