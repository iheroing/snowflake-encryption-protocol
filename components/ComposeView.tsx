import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSound } from '../contexts/SoundContext';
import { playHaptic } from '../utils/haptics';
import { generateSnowflakeDataURL, generateSnowflakeParams } from '../utils/snowflakeGenerator';
import {
  createSnowflakeSignature,
  createSnowflakeVisualSalt,
  deriveSnowflakeSignature,
} from '../utils/signature';
import Icon from './Icon';
import CrystallizationEffect from './CrystallizationEffect';
import CrystallizationCeremony from './CrystallizationCeremony';
import LanguageToggleButton from './LanguageToggleButton';
import SoundToggleButton from './SoundToggleButton';

export interface ComposePayload {
  message: string;
  signature: string;
  ttlSeconds: 3600 | 86400 | 604800;
}

interface Props {
  onBack: () => void;
  onSubmit: (payload: ComposePayload) => Promise<void>;
}

const MAX_LENGTH = 500;
const TTL_OPTIONS: ComposePayload['ttlSeconds'][] = [3600, 86400, 604800];

const ComposeView: React.FC<Props> = ({ onBack, onSubmit }) => {
  const { t } = useI18n();
  const { play } = useSound();
  const [message, setMessage] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState<ComposePayload['ttlSeconds']>(86400);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const baseSignatureRef = useRef(createSnowflakeSignature());
  const visualSaltRef = useRef(createSnowflakeVisualSalt());
  const [visualSignature, setVisualSignature] = useState(baseSignatureRef.current);
  const [isTyping, setIsTyping] = useState(false);
  const trimmedMessage = message.trim();
  const snowflakeUrl = useMemo(
    () => generateSnowflakeDataURL(trimmedMessage || 'sealed snow letter', 640, visualSignature),
    [trimmedMessage, visualSignature],
  );
  const specimen = useMemo(() => {
    const params = generateSnowflakeParams(trimmedMessage || 'sealed snow letter', visualSignature);
    return { family: params.family, no: params.seedKey.slice(0, 6).toUpperCase() };
  }, [trimmedMessage, visualSignature]);

  // Re-derive the seal only after typing settles. Regenerating a fresh SVG on
  // every keystroke made the preview <img> swap its data-URL constantly, and
  // each swap flashed while the browser re-decoded the crystal.
  useEffect(() => {
    if (!trimmedMessage) {
      setVisualSignature(baseSignatureRef.current);
      setIsTyping(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void deriveSnowflakeSignature(trimmedMessage, visualSaltRef.current).then((next) => {
        if (active) {
          setVisualSignature(next);
          setIsTyping(false);
        }
      });
    }, 480);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [trimmedMessage]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmedMessage || isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    play('crystallize');
    playHaptic('crystallize');
    try {
      const signature = await deriveSnowflakeSignature(trimmedMessage, visualSaltRef.current);
      setVisualSignature(signature);
      await onSubmit({
        message: trimmedMessage,
        signature,
        ttlSeconds,
      });
    } catch (caught) {
      const nextMessage = caught instanceof Error && caught.message
        ? caught.message
        : t('compose.createFailed');
      setError(nextMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="cine-page compose-page px-4 md:px-8">
      <div className="cine-stage compose-stage">
        <header className="product-header">
          <button type="button" onClick={onBack} className="icon-button" aria-label={t('common.back')}>
            <Icon name="arrow-left" />
          </button>
          <div className="product-header-title">
            <span aria-hidden="true">❄</span>
            <div>
              <strong>{t('common.appName')}</strong>
              <small>{t('compose.step')}</small>
            </div>
          </div>
          <div className="product-header-tools">
            <LanguageToggleButton compact />
            <SoundToggleButton compact />
          </div>
        </header>

        <form className={`compose-layout${isSubmitting ? ' is-crystallizing' : ''}`} onSubmit={handleSubmit}>
          <section className="compose-editor" aria-labelledby="compose-title">
            <div className="section-kicker">{t('compose.kicker')}</div>
            <h1 id="compose-title" className="compose-title">{t('compose.title')}</h1>
            <p className="compose-lead">{t('compose.description')}</p>

            <label className="compose-field">
              <span className="sr-only">{t('compose.messageLabel')}</span>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value.slice(0, MAX_LENGTH));
                  setError('');
                  setIsTyping(true);
                }}
                placeholder={t('compose.placeholder')}
                maxLength={MAX_LENGTH}
                rows={7}
                autoFocus
                spellCheck
                aria-describedby="compose-count compose-privacy"
              />
              <span id="compose-count" className="compose-count" aria-live="polite">
                {message.length} / {MAX_LENGTH}
              </span>
            </label>

            <fieldset className="ttl-fieldset">
              <legend>{t('compose.expiryLabel')}</legend>
              <div className="ttl-options">
                {TTL_OPTIONS.map((value) => (
                  <label key={value} className={ttlSeconds === value ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name="ttl"
                      value={value}
                      checked={ttlSeconds === value}
                      onChange={() => setTtlSeconds(value)}
                    />
                    <span>{t(`compose.ttl${value}`)}</span>
                    {value === 86400 && <small>{t('compose.recommended')}</small>}
                  </label>
                ))}
              </div>
            </fieldset>

            <div id="compose-privacy" className="privacy-note">
              <Icon name="shield" size={18} />
              <p>
                <strong>{t('compose.privacyTitle')}</strong>
                <span>{t('compose.privacyBody')}</span>
              </p>
            </div>

            {error && (
              <div className="inline-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-action"
              disabled={!trimmedMessage || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="activity-indicator" aria-hidden="true" />
                  {t('compose.sealing')}
                </>
              ) : (
                <>
                  <Icon name="lock" size={19} />
                  {t('compose.seal')}
                </>
              )}
            </button>
          </section>

          <aside className="compose-preview" aria-label={t('compose.previewLabel')}>
            <div className="preview-orbit" aria-hidden="true" />
            <div className={`preview-card${isSubmitting ? ' is-crystallizing' : ''}`}>
              <div className="preview-card-meta">
                <span>{t('compose.previewEyebrow')}</span>
                <Icon name="lock" size={16} />
              </div>
              <div className="preview-dish">
                <img 
                  src={snowflakeUrl} 
                  alt={t('compose.previewAlt')} 
                  decoding="async" 
                  className={isTyping ? 'is-typing' : ''}
                />
              </div>
              {isSubmitting && <CrystallizationEffect phase="forming" />}
              <p className="preview-specimen" aria-hidden="true">
                <span className="preview-specimen-no">№ {specimen.no}</span>
                <span className="preview-specimen-divider" />
                <span>{t(`gallery.families.${specimen.family}`)}</span>
              </p>
              <div className="preview-caption">
                <small>{t('compose.previewCaption')}</small>
                <strong>{trimmedMessage ? t('compose.uniqueReady') : t('compose.waiting')}</strong>
              </div>
            </div>
          </aside>
        </form>
      </div>
      {isSubmitting && (
        <CrystallizationCeremony
          imageUrl={snowflakeUrl}
          label={t('compose.sealing')}
          phase="forming"
          sourceText={trimmedMessage}
        />
      )}
    </main>
  );
};

export default ComposeView;
