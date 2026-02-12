import React from 'react';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  compact?: boolean;
}

const LanguageToggleButton: React.FC<Props> = ({ compact = false }) => {
  const { t, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      className={`cine-btn-ghost rounded-full flex items-center justify-center ${
        compact ? 'h-10 px-3 text-xs' : 'h-10 px-4 text-sm'
      }`}
      title={t('common.switchLanguage')}
    >
      <span className="font-semibold tracking-wide">{t('common.language')}</span>
    </button>
  );
};

export default LanguageToggleButton;

