import React, { useMemo, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSound } from '../contexts/SoundContext';
import { generateSnowflakeDataURL, hashString } from '../utils/snowflakeGenerator';
import { getSnowflakeId } from '../utils/signature';
import Icon from './Icon';
import LanguageToggleButton from './LanguageToggleButton';
import SoundToggleButton from './SoundToggleButton';
import './AfterglowView.css';

interface Props {
  onBack: () => void;
  onExit: () => void;
  message?: string;
  signature?: string;
}

type CanvasKind = 'postcard' | 'desktop' | 'mobile';

interface CanvasOption {
  id: CanvasKind;
  labelKey: string;
  width: number;
  height: number;
  fileLabel: string;
}

const CANVAS_OPTIONS: readonly CanvasOption[] = [
  {
    id: 'postcard',
    labelKey: 'afterglow.optionPostcard',
    width: 1600,
    height: 1000,
    fileLabel: 'postcard'
  },
  {
    id: 'desktop',
    labelKey: 'afterglow.optionDesktop',
    width: 2560,
    height: 1440,
    fileLabel: 'wallpaper'
  },
  {
    id: 'mobile',
    labelKey: 'afterglow.optionMobile',
    width: 1080,
    height: 1920,
    fileLabel: 'lockscreen'
  }
] as const;

function seededUnit(seed: number, index: number): number {
  const value = Math.sin(seed * 0.0001 + index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function drawStardust(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number): void {
  const count = Math.max(80, Math.round((width * height) / 30_000));

  ctx.save();
  for (let index = 0; index < count; index += 1) {
    const x = seededUnit(seed, index * 3) * width;
    const y = seededUnit(seed, index * 3 + 1) * height;
    const radius = 0.6 + seededUnit(seed, index * 3 + 2) * 1.6;
    const alpha = 0.05 + seededUnit(seed, index * 5 + 3) * 0.16;

    ctx.fillStyle = `rgba(234, 242, 250, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Snowflake artwork could not be loaded'));
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('PNG export returned an empty result'));
      }
    }, 'image/png', 1);
  });
}

const AfterglowView: React.FC<Props> = ({
  onBack,
  onExit,
  message = 'A whisper from the void',
  signature = 'afterglow_default'
}) => {
  const [selectedCanvas, setSelectedCanvas] = useState<CanvasKind>('postcard');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { play } = useSound();
  const { t, localeTag } = useI18n();

  const capturedAt = useMemo(() => new Date(), []);
  const snowflakeURL = useMemo(
    () => generateSnowflakeDataURL(message, 1200, signature),
    [message, signature]
  );
  const snowflakeId = useMemo(() => getSnowflakeId(signature), [signature]);
  const selectedOption = CANVAS_OPTIONS.find((option) => option.id === selectedCanvas) ?? CANVAS_OPTIONS[0];

  const capturedLabel = useMemo(
    () => capturedAt.toLocaleString(localeTag, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    [capturedAt, localeTag]
  );

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setExportError('');

    try {
      const { width, height, fileLabel } = selectedOption;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas is unavailable');
      }

      canvas.width = width;
      canvas.height = height;

      const background = ctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.72
      );
      background.addColorStop(0, '#142536');
      background.addColorStop(0.42, '#0b121d');
      background.addColorStop(1, '#040609');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      drawStardust(ctx, width, height, hashString(signature));

      const glow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        0,
        width * 0.5,
        height * 0.45,
        Math.min(width, height) * 0.48
      );
      glow.addColorStop(0, 'rgba(196, 219, 240, 0.16)');
      glow.addColorStop(0.48, 'rgba(196, 219, 240, 0.05)');
      glow.addColorStop(1, 'rgba(196, 219, 240, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const image = await loadImage(snowflakeURL);
      const snowflakeSize = Math.min(width, height) * (selectedCanvas === 'mobile' ? 0.58 : 0.52);
      const snowflakeX = (width - snowflakeSize) / 2;
      const snowflakeY = selectedCanvas === 'mobile'
        ? height * 0.15
        : (height - snowflakeSize) / 2 - height * 0.08;

      ctx.save();
      
      ctx.shadowColor = 'rgba(184, 210, 235, 0.34)';
      ctx.shadowBlur = Math.min(width, height) * 0.045;
      ctx.drawImage(image, snowflakeX, snowflakeY, snowflakeSize, snowflakeSize);
      ctx.restore();

      const textCenterY = Math.round(selectedCanvas === 'mobile' ? height * 0.8 : height * 0.85);
      const spacing = Math.round(height * 0.025);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Phase quote
      ctx.fillStyle = 'rgba(214, 233, 252, 0.95)';
      ctx.font = `${Math.round(height * 0.026)}px "Noto Serif SC Variable", "Source Han Serif SC", serif`;
      if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0.12em';
      
      ctx.fillRect(Math.round(width / 2 - width * 0.02), Math.round(textCenterY - spacing * 3), Math.round(width * 0.04), 1);
      ctx.fillText(t('landing.phase'), Math.round(width / 2), Math.round(textCenterY - spacing * 1));
      
      // Subtitle
      ctx.fillStyle = 'rgba(214, 233, 252, 0.6)';
      ctx.font = `600 ${Math.round(height * 0.016)}px "Noto Serif SC Variable", "Source Han Serif SC", serif`;
      if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0.25em';
      ctx.fillText(t('common.appSubtitle').toUpperCase(), Math.round(width / 2), Math.round(textCenterY + spacing * 1));
      
      // Snowflake ID
      ctx.fillStyle = 'rgba(214, 233, 252, 0.6)';
      ctx.font = `500 ${Math.round(height * 0.018)}px "Inter", sans-serif`;
      if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0.15em';
      ctx.fillText(snowflakeId, Math.round(width / 2), Math.round(textCenterY + spacing * 2.5));

      // Date
      ctx.fillStyle = 'rgba(214, 233, 252, 0.35)';
      ctx.font = `500 ${Math.round(height * 0.014)}px "Inter", sans-serif`;
      if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0.1em';
      ctx.fillText(`${t('afterglow.capturedAt')} ${capturedLabel}`, Math.round(width / 2), Math.round(textCenterY + spacing * 4.2));

      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `snowflake-whisper-${fileLabel}-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      play('export');
    } catch {
      setExportError(t('afterglow.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="afterglow-view" aria-labelledby="afterglow-title">
      <div className="afterglow-ambient" aria-hidden="true" />

      <header className="afterglow-header">
        <button type="button" className="afterglow-back" onClick={onBack}>
          <Icon name="arrow-left" size={18} />
          <span>{t('afterglow.return')}</span>
        </button>

        <div className="afterglow-brand" aria-label={t('common.appName')}>
          <Icon name="snowflake" size={19} />
          <span>{t('common.appName')}</span>
        </div>

        <div className="afterglow-utilities">
          <LanguageToggleButton compact />
          <SoundToggleButton compact />
          <button
            type="button"
            className="afterglow-close"
            onClick={onExit}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <Icon name="close" size={19} />
          </button>
        </div>
      </header>

      <main className="afterglow-main">
        <section className="afterglow-preview-region" aria-label={t('afterglow.title')}>
          <figure className="afterglow-art" data-canvas={selectedCanvas}>
            <div className="afterglow-art-stars" aria-hidden="true" />
            <img 
              className="afterglow-snowflake" 
              src={snowflakeURL} 
              alt="" 
              style={{
                '--snowflake-rotation': `${selectedCanvas === 'desktop' ? 60 : selectedCanvas === 'mobile' ? 120 : 0}deg`
              } as React.CSSProperties}
            />

            <figcaption className="afterglow-poetic-meta">
              <div className="afterglow-poetic-line" aria-hidden="true" />
              <p className="afterglow-poetic-quote">{t('landing.phase')}</p>
              <p className="afterglow-poetic-subtitle">{t('common.appSubtitle').toUpperCase()}</p>
              <p className="afterglow-poetic-id">{snowflakeId}</p>
              <p className="afterglow-poetic-date">{t('afterglow.capturedAt')} {capturedLabel}</p>
            </figcaption>
          </figure>
        </section>

        <aside className="afterglow-controls" aria-labelledby="afterglow-title">
          <div className="afterglow-copy">
            <span className="afterglow-kicker">{t('common.appSubtitle')}</span>
            <h1 id="afterglow-title" data-view-heading tabIndex={-1} autoFocus>{t('afterglow.title')}</h1>
            <p>{t('afterglow.desc')}</p>
          </div>

          <fieldset className="afterglow-options">
            <legend>{t('afterglow.canvasSelection')}</legend>
            <div className="afterglow-option-list">
              {CANVAS_OPTIONS.map((option) => {
                const isSelected = selectedCanvas === option.id;

                return (
                  <label className="afterglow-option" data-selected={isSelected} key={option.id}>
                    <input
                      className="afterglow-option-input"
                      type="radio"
                      name="afterglow-canvas"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => setSelectedCanvas(option.id)}
                    />
                    <span className="afterglow-option-mark" aria-hidden="true">
                      {isSelected ? <Icon name="check" size={15} /> : null}
                    </span>
                    <span className="afterglow-option-label">{t(option.labelKey)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="afterglow-export-group">
            <button
              type="button"
              className="afterglow-export"
              onClick={handleExport}
              disabled={isExporting}
              aria-busy={isExporting}
            >
              {isExporting ? (
                <span className="activity-indicator" aria-hidden="true" />
              ) : (
                <Icon name="download" size={19} />
              )}
              <span>{isExporting ? t('afterglow.exporting') : t('afterglow.export')}</span>
            </button>
            <p role="status" aria-live="polite">
              {selectedOption.width} × {selectedOption.height}, {t('afterglow.hiRes')}
            </p>
            {exportError && (
              <p className="afterglow-export-error" role="alert">{exportError}</p>
            )}
          </div>
        </aside>
      </main>

      <footer className="afterglow-footer" aria-label={t('afterglow.footerEngine')}>
        <span className="afterglow-engine">
          {t('afterglow.footerEngine')}
        </span>
        <span>{t('afterglow.footerRender')}: {selectedOption.width} × {selectedOption.height}</span>
      </footer>
    </section>
  );
};

export default AfterglowView;
