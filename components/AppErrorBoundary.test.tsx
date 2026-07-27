import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AppErrorBoundary from './AppErrorBoundary';

describe('AppErrorBoundary', () => {
  it('returns users to the mounted application home after a render failure', () => {
    const boundary = new AppErrorBoundary({ children: null });
    boundary.state = { hasError: true };

    const markup = renderToStaticMarkup(boundary.render());

    expect(markup).toContain('href="/snowflake/"');
  });
});
