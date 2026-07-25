import React, { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import Icon from './Icon';
import './AlgorithmModal.css';

interface Props {
  onClose: () => void;
}

const AlgorithmModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={`algo-modal-overlay ${mounted ? 'is-visible' : ''}`} onClick={handleOverlayClick}>
      <div className="algo-modal-content">
        <button className="algo-modal-close" onClick={onClose} aria-label={t('common.close')}>
          <Icon name="close" size={20} />
        </button>
        <div className="algo-modal-body">
          <header className="algo-header">
            <h2>{t('algo.title')}</h2>
            <p className="algo-subtitle">{t('algo.subtitle')}</p>
          </header>
          
          <div className="algo-text">
            <p className="algo-intro">{t('algo.p1')}</p>
            
            <div className="algo-section">
              <h3>{t('algo.p2')}</h3>
              <p>{t('algo.p2Desc')}</p>
            </div>

            <div className="algo-section">
              <h3>{t('algo.p3')}</h3>
              <p>{t('algo.p3Desc')}</p>
            </div>

            <div className="algo-section">
              <h3>{t('algo.p4')}</h3>
              <p>{t('algo.p4Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmModal;
