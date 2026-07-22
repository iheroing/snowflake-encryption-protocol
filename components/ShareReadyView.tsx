import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { getSnowflakeId } from '../utils/signature';
import Icon from './Icon';
import LanguageToggleButton from './LanguageToggleButton';
import SoundToggleButton from './SoundToggleButton';

export interface SealedWhisper {
  id: string;
  signature: string;
  shareUrl: string;
  deleteToken: string;
  expiresAt: number;
}

interface Props {
  whisper: SealedWhisper;
  onCreateAnother: () => void;
  onExport: () => void;
  onRevoke: (id: string, deleteToken: string) => Promise<'deleted' | 'gone'>;
}

type Feedback = { message: string; kind: 'success' | 'error' | 'neutral' };

const ShareReadyView: React.FC<Props> = ({ whisper, onCreateAnother, onExport, onRevoke }) => {
  const { t, localeTag } = useI18n();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeOutcome, setRevokeOutcome] = useState<'deleted' | 'gone' | null>(null);
  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);
  const [isShowingQr, setIsShowingQr] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState('');
  const revokeDialogRef = useRef<HTMLDialogElement>(null);
  const qrDialogRef = useRef<HTMLDialogElement>(null);
  const isUnavailable = revokeOutcome !== null;
  const snowflakeUrl = useMemo(
    () => generateSnowflakeDataURL(whisper.signature, 900, whisper.signature),
    [whisper.signature],
  );
  const expiresAtLabel = new Date(whisper.expiresAt).toLocaleString(localeTag, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    const dialog = revokeDialogRef.current;
    if (!dialog) return;
    if (isConfirmingRevoke && !dialog.open) dialog.showModal();
    if (!isConfirmingRevoke && dialog.open) dialog.close();
  }, [isConfirmingRevoke]);

  useEffect(() => {
    const dialog = qrDialogRef.current;
    if (!dialog) return;
    if (isShowingQr && !dialog.open) dialog.showModal();
    if (!isShowingQr && dialog.open) dialog.close();
  }, [isShowingQr]);

  const showQrCode = async () => {
    if (isUnavailable) return;
    setIsShowingQr(true);
    if (qrDataUrl || isQrLoading) return;
    setQrError('');
    setIsQrLoading(true);
    try {
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.toDataURL(whisper.shareUrl, {
        errorCorrectionLevel: 'M',
        width: 320,
        margin: 2,
        color: {
          dark: '#07101AFF',
          light: '#F4FBFDFF',
        },
      });
      setQrDataUrl(dataUrl);
    } catch {
      setQrError(t('shareReady.qrFailed'));
    } finally {
      setIsQrLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(whisper.shareUrl);
      setFeedback({ message: t('shareReady.copied'), kind: 'success' });
    } catch {
      setFeedback({ message: t('shareReady.copyFailed'), kind: 'error' });
    }
  };

  const shareLink = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: t('shareReady.shareTitle'),
        text: t('shareReady.shareText'),
        url: whisper.shareUrl,
      });
      setFeedback({ message: t('shareReady.shared'), kind: 'success' });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      await copyLink();
    }
  };

  const revoke = async () => {
    if (isRevoking || isUnavailable) return;
    setIsRevoking(true);
    setFeedback(null);
    try {
      const outcome = await onRevoke(whisper.id, whisper.deleteToken);
      setRevokeOutcome(outcome);
      setFeedback({
        message: outcome === 'deleted' ? t('shareReady.revoked') : t('shareReady.unavailableFeedback'),
        kind: outcome === 'deleted' ? 'success' : 'neutral',
      });
    } catch (caught) {
      setFeedback({
        message: caught instanceof Error ? caught.message : t('shareReady.revokeFailed'),
        kind: 'error',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <main className="cine-page sealed-page px-4 md:px-8">
      <div className="cine-stage sealed-stage">
        <header className="product-header">
          <button type="button" onClick={onCreateAnother} className="icon-button" aria-label={t('common.close')}>
            <Icon name="close" />
          </button>
          <div className="product-header-title">
            <span aria-hidden="true">❄</span>
            <div>
              <strong>{t('common.appName')}</strong>
              <small>{t('shareReady.step')}</small>
            </div>
          </div>
          <div className="product-header-tools">
            <LanguageToggleButton compact />
            <SoundToggleButton compact />
          </div>
        </header>

        <section className="sealed-layout" aria-labelledby="sealed-title">
          <div className="sealed-art" aria-hidden="true">
            <div className="sealed-art-halo" />
            <img src={snowflakeUrl} alt="" />
            <span>{getSnowflakeId(whisper.signature)}</span>
          </div>

          <div className="sealed-content">
            <div className="success-mark" aria-hidden="true"><Icon name="check" /></div>
            <p className="section-kicker">
              {revokeOutcome ? t('shareReady.closedKicker') : t('shareReady.kicker')}
            </p>
            <h1 id="sealed-title" data-view-heading tabIndex={-1} autoFocus>
              {revokeOutcome === 'deleted'
                ? t('shareReady.revokedTitle')
                : revokeOutcome === 'gone'
                  ? t('shareReady.unavailableTitle')
                  : t('shareReady.title')}
            </h1>
            <p className="sealed-lead">
              {revokeOutcome === 'deleted'
                ? t('shareReady.revokedBody')
                : revokeOutcome === 'gone'
                  ? t('shareReady.unavailableBody')
                  : t('shareReady.description')}
            </p>

            {!revokeOutcome && (
              <div className="single-read-warning">
                <Icon name="eye" size={19} />
                <p>
                  <strong>{t('shareReady.warningTitle')}</strong>
                  <span>{t('shareReady.warningBody')}</span>
                </p>
              </div>
            )}

            <div className="share-link-box">
              <label htmlFor="sealed-share-url">{t('shareReady.linkLabel')}</label>
              <div>
                <input
                  id="sealed-share-url"
                  value={isUnavailable ? '' : whisper.shareUrl}
                  readOnly
                  disabled={isUnavailable}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button type="button" onClick={copyLink} aria-label={t('shareReady.copy')} disabled={isUnavailable}>
                  <Icon name="copy" />
                </button>
              </div>
              <small>{t('shareReady.expiresAt', { time: expiresAtLabel })}</small>
            </div>

            <div className="share-actions">
              <button type="button" className="primary-action" onClick={shareLink} disabled={isUnavailable}>
                <Icon name="share" size={19} />
                {t('shareReady.share')}
              </button>
              <button type="button" className="secondary-action" onClick={copyLink} disabled={isUnavailable}>
                <Icon name="copy" size={18} />
                {t('shareReady.copy')}
              </button>
            </div>

            <div className="sealed-secondary-actions">
              <button type="button" onClick={() => void showQrCode()} disabled={isUnavailable}>
                <Icon name="qr-code" size={17} />
                {t('shareReady.qr')}
              </button>
              <button type="button" onClick={onExport}>
                <Icon name="download" size={17} />
                {t('shareReady.saveArt')}
              </button>
              <button
                type="button"
                className="danger-link"
                onClick={() => setIsConfirmingRevoke(true)}
                disabled={isRevoking || isUnavailable}
              >
                <Icon name="trash" size={17} />
                {revokeOutcome ? t('shareReady.closed') : isRevoking ? t('shareReady.revoking') : t('shareReady.revoke')}
              </button>
            </div>

            {feedback && (
              <p
                className={`action-feedback is-${feedback.kind}`}
                role={feedback.kind === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {feedback.message}
              </p>
            )}
          </div>
        </section>
      </div>

      <dialog
        ref={revokeDialogRef}
        className="revoke-dialog"
        aria-labelledby="revoke-dialog-title"
        onCancel={() => setIsConfirmingRevoke(false)}
        onClose={() => setIsConfirmingRevoke(false)}
      >
        <div className="revoke-dialog-mark" aria-hidden="true"><Icon name="trash" size={22} /></div>
        <h2 id="revoke-dialog-title">{t('shareReady.confirmTitle')}</h2>
        <p>{t('shareReady.confirmBody')}</p>
        <div>
          <button type="button" className="secondary-action" onClick={() => setIsConfirmingRevoke(false)} autoFocus>
            {t('shareReady.confirmCancel')}
          </button>
          <button
            type="button"
            className="revoke-confirm-action"
            onClick={() => {
              setIsConfirmingRevoke(false);
              void revoke();
            }}
          >
            {t('shareReady.confirmAction')}
          </button>
        </div>
      </dialog>

      <dialog
        ref={qrDialogRef}
        className="qr-dialog"
        aria-labelledby="qr-dialog-title"
        aria-describedby="qr-dialog-description qr-dialog-warning"
        onCancel={() => setIsShowingQr(false)}
        onClose={() => setIsShowingQr(false)}
      >
        <div className="qr-dialog-header">
          <div className="qr-dialog-mark" aria-hidden="true"><Icon name="qr-code" size={22} /></div>
          <button
            type="button"
            className="icon-button"
            aria-label={t('common.close')}
            onClick={() => setIsShowingQr(false)}
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="qr-dialog-title">{t('shareReady.qrTitle')}</h2>
        <p id="qr-dialog-description">{t('shareReady.qrBody')}</p>
        <div className="qr-dialog-code" role={isQrLoading ? 'status' : undefined}>
          {isQrLoading && <><span className="activity-indicator" aria-hidden="true" />{t('shareReady.qrLoading')}</>}
          {qrDataUrl && <img src={qrDataUrl} alt={t('shareReady.qrAlt')} />}
          {qrError && <p className="inline-error" role="alert">{qrError}</p>}
        </div>
        <p id="qr-dialog-warning" className="qr-dialog-warning">
          <Icon name="shield" size={18} />
          <span>{t('shareReady.qrWarning')}</span>
        </p>
        <button type="button" className="secondary-action" onClick={() => setIsShowingQr(false)}>
          {t('shareReady.qrClose')}
        </button>
      </dialog>
    </main>
  );
};

export default ShareReadyView;
