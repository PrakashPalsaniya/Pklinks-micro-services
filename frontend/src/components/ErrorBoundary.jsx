import { Component } from "react";
import { Button } from "./ui/Button";

// Catches render errors in the tree below and shows a fallback
// instead of crashing the whole app to a blank screen.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught render error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[50vh] place-items-center p-6 text-center">
          <div className="max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
            <p className="text-sm text-muted">
              This section failed to load. You can try again or reload the page.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={this.handleReset}>Try again</Button>
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
