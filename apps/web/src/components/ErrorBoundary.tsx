/**
 * Route-level error boundary — the SPA used to white-screen entirely when
 * any route threw during render. The boundary keeps the shell (header,
 * footer, navigation) alive and offers a localized recovery path.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Card } from './ui';
import { useI18n } from '../lib/locale';
import { navigate } from '../router';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

function ErrorScreen({ onRetry }: { onRetry: () => void }): ReactNode {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col items-center px-5 py-14 text-center sm:max-w-[600px] lg:max-w-[1020px] lg:px-10">
      <Card className="w-full max-w-md py-10">
        <div className="mb-4 text-5xl opacity-40" aria-hidden="true">
          🧭
        </div>
        <h1 className="mb-2 text-lg font-bold text-currena-dark">{t('app.errorTitle')}</h1>
        <p className="mx-auto mb-6 max-w-xs text-sm text-currena-muted">{t('app.errorText')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="cta" className="px-6 py-3" onClick={onRetry}>
            {t('app.errorRetry')}
          </Button>
          <Button
            variant="ghost"
            className="px-6 py-3"
            onClick={() => {
              onRetry();
              navigate('/');
            }}
          >
            {t('app.errorHome')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[app] route render crashed:', error, info.componentStack);
  }

  private readonly retry = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error !== null) {
      return <ErrorScreen onRetry={this.retry} />;
    }
    return this.props.children;
  }
}
