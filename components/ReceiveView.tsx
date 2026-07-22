import React, { useMemo, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { getSnowflakeId } from '../utils/signature';
import Icon from './Icon';
import LanguageToggleButton from './LanguageToggleButton';
import SoundToggleButton from './SoundToggleButton';

export type ReceiveStatus = 'loading' | 'sealed' | 'gone' | 'invalid' | 'offline' | 'uncertain';

interface Props {
  id: string;
  status: ReceiveStatus;
  expiresAt?: number;
  signature?: string;
  onExit: () => void;
  onRetry: () => Promise<void>;
  onReveal: () => Promise<void>;
}

const ReceiveView: React.FC<Props> = ({
  id,
  status,
  expiresAt,
  signature,
  onExit,
  onRetry,
  onReveal,
}) => {
  const { t, localeTag } = useI18n();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState('');
  const visualSignature = signature || id;
  const snowflakeUrl = useMemo(
    () => generateSnowflakeDataURL(id, 900, visualSignature),
    [id, visualSignature],
  );
  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString(localeTag, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  const reveal = async () => {
    if (isOpening || status !== 'sealed') return;
    setError('');
    setIsOpening(true);
    try {
      await onReveal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('receive.openFailed'));
      setIsOpening(false);
    }
  };

  const retry = async () => {
    setError('');
    try {
      await onRetry();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('receive.retryFailed'));
    }
  };

  const renderState = () => {
    if (status === 'loading') {
      return (
        <div className="receive-state" role="status">
          <span className="activity-indicator large" aria-hidden="true" />
          <h1 data-view-heading tabIndex={-1} autoFocus>{t('receive.checking')}</h1>
          <p>{t('receive.checkingBody')}</p>
        </div>
      );
    }

    if (status === 'gone') {
      return (
        <div className="receive-state">
          <div className="gone-mark" aria-hidden="true"><Icon name="snowflake" size={30} /></div>
          <p className="section-kicker">{t('receive.goneKicker')}</p>
          <h1 data-view-heading tabIndex={-1} autoFocus>{t('receive.goneTitle')}</h1>
          <p>{t('receive.goneBody')}</p>
          <button type="button" className="secondary-action" onClick={onExit}>{t('receive.createOwn')}</button>
        </div>
      );
    }

    if (status === 'invalid') {
      return (
        <div className="receive-state">
          <div className="gone-mark" aria-hidden="true"><Icon name="close" size={28} /></div>
          <p className="section-kicker">{t('receive.invalidKicker')}</p>
          <h1 data-view-heading tabIndex={-1} autoFocus>{t('receive.invalidTitle')}</h1>
          <p>{t('receive.invalidBody')}</p>
          <button type="button" className="secondary-action" onClick={onExit}>{t('common.back')}</button>
        </div>
      );
    }

    if (status === 'offline') {
      return (
        <div className="receive-state">
          <div className="gone-mark" aria-hidden="true"><Icon name="refresh" size={28} /></div>
          <p className="section-kicker">{t('receive.offlineKicker')}</p>
          <h1 data-view-heading tabIndex={-1} autoFocus>{t('receive.offlineTitle')}</h1>
          <p>{t('receive.offlineBody')}</p>
          <button type="button" className="secondary-action" onClick={retry}>
            <Icon name="refresh" size={18} />
            {t('receive.retry')}
          </button>
        </div>
      );
    }

    if (status === 'uncertain') {
      return (
        <div className="receive-state">
          <div className="gone-mark" aria-hidden="true"><Icon name="shield" size={28} /></div>
          <p className="section-kicker">{t('receive.uncertainKicker')}</p>
          <h1 data-view-heading tabIndex={-1} autoFocus>{t('receive.uncertainTitle')}</h1>
          <p>{t('receive.uncertainBody')}</p>
          <button type="button" className="secondary-action" onClick={retry}>
            <Icon name="refresh" size={18} />
            {t('receive.checkAgain')}
          </button>
        </div>
      );
    }

    return (
      <div className="receive-state sealed">
        <p className="section-kicker">{t('receive.kicker')}</p>
        <h1 data-view-heading tabIndex={-1} autoFocus>{t('receive.title')}</h1>
        <p>{t('receive.description')}</p>
        <div className="receive-meta">
          <span><Icon name="lock" size={15} />{getSnowflakeId(visualSignature)}</span>
          {expiryLabel && <span>{t('receive.expiresAt', { time: expiryLabel })}</span>}
        </div>
        <button type="button" className="primary-action reveal-action" onClick={reveal} disabled={isOpening}>
          {isOpening ? (
            <><span className="activity-indicator" aria-hidden="true" />{t('receive.opening')}</>
          ) : (
            <><Icon name="eye" size={20} />{t('receive.open')}</>
          )}
        </button>
        <p className="consume-disclosure"><Icon name="shield" size={15} />{t('receive.consumeDisclosure')}</p>
        {error && <div className="inline-error" role="alert">{error}</div>}
      </div>
    );
  };

  return (
    <main className="cine-page receive-page px-4 md:px-8">
      <div className="cine-stage receive-stage">
        <header className="product-header">
          <button type="button" onClick={onExit} className="icon-button" aria-label={t('common.close')}>
            <Icon name="close" />
          </button>
          <div className="product-header-title">
            <span aria-hidden="true">❄</span>
            <div>
              <strong>{t('common.appName')}</strong>
              <small>{t('receive.step')}</small>
            </div>
          </div>
          <div className="product-header-tools">
            <LanguageToggleButton compact />
            <SoundToggleButton compact />
          </div>
        </header>

        <section className="receive-layout" aria-live="polite" aria-atomic="false">
          <div className={`receive-art ${status !== 'sealed' ? 'is-muted' : ''}`} aria-hidden="true">
            <div className="receive-art-ring" />
            <img src={snowflakeUrl} alt="" />
            <div className="receive-seal"><Icon name="lock" size={18} /></div>
          </div>
          {renderState()}
        </section>
      </div>
    </main>
  );
};

export default ReceiveView;
