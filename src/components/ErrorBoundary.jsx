import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-3xl mx-auto px-10 py-24 text-center">
          <div className="font-deco text-3xl text-maroon-dark mb-4">Something Tore</div>
          <p className="italic text-ink/60 mb-6">
            This page hit a snag rendering — most likely something in the entry's data didn't match what this view expected.
          </p>
          <p className="text-[12px] text-ink/40 font-mono mb-8">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="font-display text-xs uppercase tracking-wide px-4 py-2 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
