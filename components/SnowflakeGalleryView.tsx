import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  getKeepsakes,
  KEEPSAKE_CHANGE_EVENT,
  removeKeepsake,
  type SnowflakeKeepsake,
} from '../utils/keepsakeGallery';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import Icon from './Icon';
import LanguageToggleButton from './LanguageToggleButton';
import SoundToggleButton from './SoundToggleButton';

interface Props {
  onBack: () => void;
  onCreate: () => void;
}

const SnowflakeGalleryView: React.FC<Props> = ({ onBack, onCreate }) => {
  const { t, localeTag } = useI18n();
  const [keepsakes, setKeepsakes] = useState(getKeepsakes);
  const [selected, setSelected] = useState<SnowflakeKeepsake | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reload = () => setKeepsakes(getKeepsakes());
    window.addEventListener(KEEPSAKE_CHANGE_EVENT, reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener(KEEPSAKE_CHANGE_EVENT, reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    setIsConfirmingDelete(false);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelected(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleDialogKey);
    return () => {
      window.removeEventListener('keydown', handleDialogKey);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [selected]);

  const selectedImage = useMemo(() => selected
    ? generateSnowflakeDataURL(selected.signature, 900, selected.signature)
    : '', [selected]);

  const removeSelected = () => {
    if (!selected) return;
    removeKeepsake(selected.signature);
    setIsConfirmingDelete(false);
    setSelected(null);
  };

  return (
    <main className="cine-page gallery-page px-4 md:px-8">
      <div className="cine-stage gallery-stage">
        <header className="product-header">
          <button type="button" onClick={onBack} className="icon-button" aria-label={t('common.back')}>
            <Icon name="arrow-left" />
          </button>
          <div className="product-header-title">
            <span aria-hidden="true">❄</span>
            <div>
              <strong>{t('gallery.title')}</strong>
              <small>{t('gallery.localOnly')}</small>
            </div>
          </div>
          <div className="product-header-tools">
            <LanguageToggleButton compact />
            <SoundToggleButton compact />
          </div>
        </header>

        <section className="gallery-intro" aria-labelledby="gallery-title">
          <div>
            <h1 id="gallery-title" data-view-heading tabIndex={-1} autoFocus>{t('gallery.heading')}</h1>
            <p>{t('gallery.description')}</p>
          </div>
          <div className="gallery-count" aria-label={t('gallery.count', { count: keepsakes.length })}>
            <strong>{keepsakes.length}</strong>
            <span>{t('gallery.specimens')}</span>
          </div>
        </section>

        <div className="gallery-privacy-note">
          <Icon name="shield" size={18} />
          <p><strong>{t('gallery.privacyTitle')}</strong><span>{t('gallery.privacyBody')}</span></p>
        </div>

        {keepsakes.length === 0 ? (
          <section className="gallery-empty">
            <div className="gallery-empty-mark" aria-hidden="true"><Icon name="snowflake" size={44} /></div>
            <h2>{t('gallery.emptyTitle')}</h2>
            <p>{t('gallery.emptyBody')}</p>
            <button type="button" className="primary-action" onClick={onCreate}>
              <Icon name="plus" size={18} />
              {t('gallery.create')}
            </button>
          </section>
        ) : (
          <section className="specimen-grid" aria-label={t('gallery.collectionLabel')}>
            {keepsakes.map((item, index) => (
              <button
                type="button"
                className="specimen-card"
                key={item.signature}
                onClick={() => setSelected(item)}
                style={{ '--specimen-delay': `${Math.min(index, 8) * 55}ms` } as React.CSSProperties}
                aria-label={t('gallery.openSpecimen', { id: item.id })}
              >
                <span className="specimen-orbit" aria-hidden="true" />
                <img src={generateSnowflakeDataURL(item.signature, 520, item.signature)} alt="" />
                <span className="specimen-meta">
                  <strong>{item.id}</strong>
                  <small>
                    <span>{t(`gallery.origin${item.origin === 'sent' ? 'Sent' : 'Received'}`)}</span>
                    <span>{new Date(item.collectedAt).toLocaleDateString(localeTag, { month: 'short', day: 'numeric' })}</span>
                  </small>
                </span>
              </button>
            ))}
            <button type="button" className="specimen-card is-create" onClick={onCreate}>
              <span aria-hidden="true"><Icon name="plus" size={28} /></span>
              <strong>{t('gallery.createAnother')}</strong>
            </button>
          </section>
        )}
      </div>

      {selected && (
        <div className="specimen-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setSelected(null);
        }}>
          <section ref={dialogRef} className="specimen-dialog" role="dialog" aria-modal="true" aria-labelledby="specimen-title">
            <button type="button" className="icon-button specimen-close" onClick={() => setSelected(null)} aria-label={t('common.close')} autoFocus>
              <Icon name="close" />
            </button>
            <div className="specimen-dialog-art" aria-hidden="true">
              <span />
              <img src={selectedImage} alt="" />
            </div>
            <div className="specimen-dialog-copy">
              <p>{t(`gallery.origin${selected.origin === 'sent' ? 'Sent' : 'Received'}`)}</p>
              <h2 id="specimen-title">{selected.id}</h2>
              <dl>
                <div><dt>{t('gallery.familyLabel')}</dt><dd>{t(`gallery.families.${selected.family}`)}</dd></div>
                <div><dt>{t('gallery.collectedAt')}</dt><dd>{new Date(selected.collectedAt).toLocaleString(localeTag, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
              </dl>
              <figure className="specimen-lore">
                <figcaption>{t('gallery.loreLabel')}</figcaption>
                <p>{t(`gallery.lore.${selected.family}`)}</p>
              </figure>
              <p className="specimen-no-text"><Icon name="shield" size={17} />{t('gallery.noText')}</p>
              {isConfirmingDelete ? (
                <div className="specimen-delete-confirm" role="group" aria-label={t('gallery.deleteConfirm')}>
                  <p>{t('gallery.deleteConfirm')}</p>
                  <div>
                    <button type="button" onClick={() => setIsConfirmingDelete(false)} autoFocus>
                      {t('gallery.deleteCancel')}
                    </button>
                    <button type="button" className="specimen-delete-action" onClick={removeSelected}>
                      {t('gallery.deleteAction')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="quiet-action specimen-delete" onClick={() => setIsConfirmingDelete(true)}>
                  <Icon name="trash" size={17} />{t('gallery.delete')}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default SnowflakeGalleryView;
