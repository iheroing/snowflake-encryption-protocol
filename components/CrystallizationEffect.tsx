import React from 'react';

interface Props {
  phase: 'forming' | 'sealed';
  sourceText?: string;
}

const PARTICLES = [
  [-42, -34], [-15, -46], [18, -43], [43, -26], [49, 8], [32, 39],
  [5, 48], [-27, 42], [-49, 18], [-48, -14], [-25, -25], [24, 22],
] as const;

const CrystallizationEffect: React.FC<Props> = ({ phase, sourceText = '' }) => {
  const glyphs = Array.from(sourceText.replace(/\s/g, '')).slice(0, PARTICLES.length);

  return (
    <div className={`crystallization-effect is-${phase}`} aria-hidden="true">
      <span className="crystal-wave crystal-wave-one" />
      <span className="crystal-wave crystal-wave-two" />
      <div className="crystal-particles">
        {PARTICLES.map(([x, y], index) => (
          <i
            key={`${x}-${y}`}
            className={glyphs[index] ? 'has-glyph' : undefined}
            style={{
              '--particle-x': `${x * 3}px`,
              '--particle-y': `${y * 3}px`,
              '--particle-delay': `${index * 42}ms`,
            } as React.CSSProperties}
          >
            {glyphs[index] ?? ''}
          </i>
        ))}
      </div>
      <div className="crystal-growth">
        <span className="crystal-core" />
        {Array.from({ length: 6 }, (_, index) => (
          <span
            className="crystal-growth-arm"
            key={index}
            style={{ '--arm-angle': `${index * 60}deg` } as React.CSSProperties}
          >
            <i className="crystal-arm-line" />
            <i className="crystal-arm-branch is-upper" />
            <i className="crystal-arm-branch is-lower" />
          </span>
        ))}
      </div>
      <span className="crystal-glare" />
    </div>
  );
};

export default CrystallizationEffect;
