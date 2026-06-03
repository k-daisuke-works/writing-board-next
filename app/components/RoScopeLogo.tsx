type Props = {
  size?: 'sm' | 'md'
  variant?: 'default' | 'light'
}

export function RoScopeLogo({ size = 'md', variant = 'default' }: Props) {
  const iconPx = size === 'sm' ? 26 : 30
  const barrel = variant === 'light' ? 'white' : '#0f172a'
  const highlight = variant === 'light' ? '#0f172a' : 'white'
  const textRo = variant === 'light' ? '#ffffff' : '#0f172a'

  const textScope =
    variant === 'light'
      ? { color: '#ffffff' }
      : {
          background: 'linear-gradient(135deg, #0d9488, #4f46e5)',
          WebkitBackgroundClip: 'text' as const,
          WebkitTextFillColor: 'transparent' as const,
          backgroundClip: 'text' as const,
        }

  const textStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: size === 'sm' ? '15px' : '18px',
    fontWeight: 900,
    letterSpacing: '-0.07em',
    lineHeight: 1,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 8 : 10 }}>
      <svg width={iconPx} height={iconPx} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rs-lens" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        {/* 左バレル */}
        <rect x="2"  y="8" width="11" height="18" rx="4" fill={barrel} />
        {/* 右バレル */}
        <rect x="19" y="8" width="11" height="18" rx="4" fill={barrel} />
        {/* ブリッジ */}
        <rect x="12" y="13" width="8"  height="6"  rx="2" fill={barrel} />
        {/* レンズ（グラデ） */}
        <circle cx="7.5"  cy="20" r="4"   fill="url(#rs-lens)" />
        <circle cx="24.5" cy="20" r="4"   fill="url(#rs-lens)" />
        {/* ハイライト */}
        <circle cx="7.5"  cy="20" r="1.8" fill={highlight} />
        <circle cx="24.5" cy="20" r="1.8" fill={highlight} />
      </svg>
      <span style={{ ...textStyle, color: textRo }}>
        Ro<span style={textScope}>Scope</span>
      </span>
    </div>
  )
}
