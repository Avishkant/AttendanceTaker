import React from "react";
import * as logger from "../lib/logger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You could also log to a remote error logging service here
    this.setState({ error, info });
    logger.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 text-red-900">
          <div className="max-w-3xl bg-white border border-red-200 rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm mb-4">
              The page encountered an error. You can try reloading or contact an
              administrator. The error details are shown below for debugging.
            </p>
            <div className="text-xs font-mono text-left bg-gray-100 p-3 rounded overflow-auto max-h-60">
              <div>
                <strong>Error:</strong>
                <pre className="whitespace-pre-wrap">
                  {String(this.state.error)}
                </pre>
              </div>
              {this.state.info && (
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap">
                    {this.state.info.componentStack}
                  </pre>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                className="px-3 py-2 bg-indigo-600 text-white rounded"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
              <button
                className="px-3 py-2 bg-gray-200 rounded"
                onClick={() =>
                  this.setState({ hasError: false, error: null, info: null })
                }
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
