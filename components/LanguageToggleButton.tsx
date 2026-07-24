import React from 'react';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  compact?: boolean;
}

const LanguageToggleButton: React.FC<Props> = ({ compact = false }) => {
  const { t, locale, toggleLocale } = useI18n();
  const label = t('common.switchLanguage');

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`lang-switch${compact ? ' is-compact' : ''}`}
      title={label}
      aria-label={label}
    >
      <span className={locale === 'zh' ? 'is-active' : ''} aria-hidden="true">中</span>
      <span className="lang-switch-divider" aria-hidden="true" />
      <span className={locale === 'en' ? 'is-active' : ''} aria-hidden="true">EN</span>
    </button>
  );
};

export default LanguageToggleButton;
