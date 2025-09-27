import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to backend if needed (optional)
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = async (error, errorInfo) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.toString(),
          errorInfo: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }),
        credentials: 'include'
      });
    } catch (logError) {
      console.error('Failed to log error to service:', logError);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <div className="card">
              <div className="text-center">
                <div className="mb-4">
                  <svg 
                    className="mx-auto h-12 w-12 text-red-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                    />
                  </svg>
                </div>
                
                <h2 className="card-title text-xl mb-2">Something went wrong</h2>
                
                <p className="text-muted mb-4">
                  An unexpected error occurred while loading this page. Our team has been notified.
                </p>

                <div className="space-y-3">
                  <button 
                    onClick={this.handleRetry}
                    className="btn btn-primary w-full"
                  >
                    Try Again
                  </button>
                  
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="btn btn-secondary w-full"
                  >
                    Return to Dashboard
                  </button>
                </div>

                {/* Show error details in development */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-muted hover:text-gray-700">
                      Error Details (Development)
                    </summary>
                    <div className="mt-2 p-3 bg-red-50 rounded border text-sm">
                      <p className="font-mono text-red-800 mb-2">
                        <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="text-xs mt-1 overflow-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;