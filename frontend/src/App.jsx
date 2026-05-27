import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { AppRoutes } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          closeButton
          toastOptions={{
            style: {
              borderRadius: "8px",
              boxShadow: "none",
              fontFamily: '"Inter", "Segoe UI", sans-serif'
            },
            classNames: {
              toast: "border font-body",
              default: "border-borderDefault bg-elevated text-ink",
              success: "border-borderDefault bg-accentDim text-accentText",
              error: "border-borderDefault bg-dangerDim text-dangerText",
              warning: "border-borderDefault bg-warningDim text-warningText",
              info: "border-borderDefault bg-surface text-ink",
              closeButton: "border-borderDefault bg-elevated text-muted hover:bg-overlay hover:text-ink"
            }
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
