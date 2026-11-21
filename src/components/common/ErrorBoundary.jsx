import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl border border-rose-600/40 shadow-xl text-center">
            <div className="w-16 h-16 bg-rose-950/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-xl font-bold text-rose-300 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-300 mb-4">
              Northeast Connect encountered an unexpected display issue. Your saved offline data is safe.
            </p>
            <div className="p-3 bg-slate-900 rounded-lg text-left text-xs font-mono text-slate-400 mb-6 max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
            <p className="text-xs text-slate-400 mt-4">
              In an immediate emergency, call <strong>112</strong> on your phone.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
