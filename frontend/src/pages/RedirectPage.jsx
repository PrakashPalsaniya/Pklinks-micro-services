import { ExternalLink, Link2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { buildRedirectProxyUrl } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";

export function RedirectPage() {
  const { code = "" } = useParams();
  const redirectUrl = useMemo(() => buildRedirectProxyUrl(code), [code]);

  useEffect(() => {
    if (!code) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      window.location.replace(redirectUrl);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [code, redirectUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-glow px-3 sm:px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Opening short link</CardTitle>
          <CardDescription>Hold on while PKLinks forwards you to the destination.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-borderSubtle bg-elevated p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-secondary">Short code</p>
            <p className="mt-3 flex items-center gap-2 font-mono text-lg font-semibold text-accent">
              <Link2 className="h-4 w-4" />
              /r/{code}
            </p>
          </div>

          <a href={redirectUrl} className="block">
            <Button type="button" variant="secondary" className="w-full justify-center" icon={ExternalLink}>
              Continue now
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
