import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useClipboard } from "../hooks/useClipboard";
import { Button } from "./ui/Button";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
  variant = "subtle",
  iconOnly = false
}) {
  const { copy } = useClipboard();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const didCopy = await copy(value);

    if (didCopy) {
      setCopied(true);
    }
  };

  const accessibleLabel = copied ? copiedLabel : typeof label === "string" ? label : "Copy";

  return (
    <Button type="button" variant={variant} size="sm" icon={copied ? Check : Copy} className={className} onClick={handleCopy}>
      {iconOnly ? <span className="sr-only">{accessibleLabel}</span> : copied ? copiedLabel : label}
    </Button>
  );
}
