import React from 'react';

interface State {
  hasError: boolean;
}

/** Last-resort UI for render failures; intentionally independent of app providers. */
export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-failure" role="alert">
        <div className="app-failure-mark" aria-hidden="true">❄</div>
        <p className="app-failure-kicker">SNOWFLAKE WHISPER</p>
        <h1>风雪暂时遮住了页面。</h1>
        <p>密语没有在这里被保存。你可以重新载入，或安全地返回首页。</p>
        <p lang="en">The page could not be rendered. Reload it or return home safely.</p>
        <div className="app-failure-actions">
          <button type="button" onClick={() => window.location.reload()}>重新载入</button>
          <a href="/">返回首页</a>
        </div>
      </main>
    );
  }
}
