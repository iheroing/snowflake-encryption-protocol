import React from 'react';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  compact?: boolean;
}

const LanguageToggleButton: React.FC<Props> = ({ compact = false }) => {
  const { t, toggleLocale } = useI18n();
  const label = t('common.switchLanguage');

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`cine-btn-ghost inline-flex min-h-11 items-center justify-center rounded-full ${
        compact ? 'min-w-11 px-3 text-xs' : 'px-4 text-sm'
      }`}
      title={label}
      aria-label={label}
    >
      <span className="font-semibold tracking-[0.08em]" aria-hidden="true">
        {t('common.language')}
      </span>
    </button>
  );
};

export default LanguageToggleButton;
