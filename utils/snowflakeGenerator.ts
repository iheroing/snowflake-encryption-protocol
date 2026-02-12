// 雪花生成器 - 基于文本Hash生成独特的分形雪花

export interface SnowflakeParams {
  branches: number;
  complexity: number;
  symmetry: number;
  seed: number;
}

// 简单的Hash函数，将文本转换为数字种子
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// 基于种子的伪随机数生成器
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

// 从文本生成雪花参数
export function generateSnowflakeParams(text: string, signature: string = ''): SnowflakeParams {
  const seedSource = signature.trim() || text;
  const hash = hashString(seedSource);
  const rng = new SeededRandom(hash);
  
  return {
    branches: 6, // 雪花总是6个分支
    complexity: Math.floor(rng.next() * 5) + 3, // 3-7层复杂度
    symmetry: rng.next() * 0.3 + 0.85, // 85%-115%对称性
    seed: hash
  };
}

// 生成雪花SVG路径
export function generateSnowflakeSVG(params: SnowflakeParams, size: number = 400): string {
  const { branches, complexity, symmetry, seed } = params;
  const rng = new SeededRandom(seed);
  const center = size / 2;
  const maxRadius = size * 0.45;
  
  let paths = '';
  
  // 为每个分支生成路径
  for (let b = 0; b < branches; b++) {
    const angle = (b * 360 / branches) * Math.PI / 180;
    const branchPath = generateBranch(rng, center, angle, maxRadius, complexity, symmetry);
    paths += branchPath;
  }
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="snowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#38dafa;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#CB73FC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <g filter="url(#glow)">
        ${paths}
      </g>
    </svg>
  `;
}

function generateBranch(
  rng: SeededRandom,
  centerX: number,
  angle: number,
  maxRadius: number,
  complexity: number,
  symmetry: number
): string {
  let path = '';
  const segments = complexity;
  
  for (let i = 0; i < segments; i++) {
    const ratio = (i + 1) / segments;
    const radius = maxRadius * ratio;
    
    // 主分支
    const x = centerX + Math.cos(angle) * radius;
    const y = centerX + Math.sin(angle) * radius;
    
    if (i === 0) {
      path += `<line x1="${centerX}" y1="${centerX}" x2="${x}" y2="${y}" stroke="url(#snowGradient)" stroke-width="${3 - ratio * 2}" stroke-linecap="round"/>`;
    }
    
    // 添加侧枝
    if (i > 0 && rng.next() > 0.3) {
      const sideLength = radius * (0.3 + rng.next() * 0.3) * symmetry;
      const sideAngle1 = angle + (Math.PI / 6 + rng.next() * Math.PI / 12);
      const sideAngle2 = angle - (Math.PI / 6 + rng.next() * Math.PI / 12);
      
      const prevRatio = i / segments;
      const prevRadius = maxRadius * prevRatio;
      const startX = centerX + Math.cos(angle) * prevRadius;
      const startY = centerX + Math.sin(angle) * prevRadius;
      
      const side1X = startX + Math.cos(sideAngle1) * sideLength;
      const side1Y = startY + Math.sin(sideAngle1) * sideLength;
      const side2X = startX + Math.cos(sideAngle2) * sideLength;
      const side2Y = startY + Math.sin(sideAngle2) * sideLength;
      
      const strokeWidth = Math.max(0.5, 2 - ratio * 1.5);
      path += `<line x1="${startX}" y1="${startY}" x2="${side1X}" y2="${side1Y}" stroke="url(#snowGradient)" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
      path += `<line x1="${startX}" y1="${startY}" x2="${side2X}" y2="${side2Y}" stroke="url(#snowGradient)" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
    }
  }
  
  return path;
}

// 生成雪花的Data URL
export function generateSnowflakeDataURL(text: string, size: number = 400, signature: string = ''): string {
  const safeText = (text ?? '').trim() || 'snowflake';
  const params = generateSnowflakeParams(safeText, signature);
  const svg = generateSnowflakeSVG(params, size).trim();

  try {
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml;charset=UTF-8,${encoded}`;
  } catch {
    // Fallback for uncommon URI encoding issues in certain webviews.
    const bytes = new TextEncoder().encode(svg);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = globalThis.btoa ? globalThis.btoa(binary) : '';
    return base64
      ? `data:image/svg+xml;base64,${base64}`
      : `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"></svg>')}`;
  }
}
