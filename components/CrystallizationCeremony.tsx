import React from 'react';
import CrystallizationEffect from './CrystallizationEffect';

interface Props {
  imageUrl: string;
  label: string;
  phase: 'forming' | 'sealed';
  sourceText?: string;
}

const CrystallizationCeremony: React.FC<Props> = ({ imageUrl, label, phase, sourceText }) => (
  <div className={`crystallization-ceremony is-${phase}`} aria-hidden="true">
    <div className="ceremony-stage">
      <div className="ceremony-halo" />
      <div className="ceremony-flake">
        <img src={imageUrl} alt="" />
        <CrystallizationEffect phase={phase} sourceText={sourceText} />
      </div>
      <p>{label}</p>
    </div>
  </div>
);

export default CrystallizationCeremony;
