import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page-glow px-3 sm:px-4">
      <div className="w-full max-w-2xl">
        <EmptyState
          icon={Compass}
          title="That route is missing"
          description="The page you asked for is not available right now."
          action={(
            <Link to="/dashboard">
              <Button icon={ArrowLeft}>Back to dashboard</Button>
            </Link>
          )}
        />
      </div>
    </div>
  );
}
