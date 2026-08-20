export default function AmbientLayer({ theme, reduceMotion }) {
  if (reduceMotion || !theme.ambient) return null;
  const type = theme.ambient.type;
  const count = type === 'candle' ? 5 : 10;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37 + 8) % 96;
        const delay = (i * 0.7) % 6;
        const dur = 6 + (i % 5);
        const size = 2 + (i % 3);
        if (type === 'candle') {
          return (
            <span key={i} className="desk-ambient-particle desk-flicker"
              style={{ left: `${left}%`, bottom: '6%', width: 5, height: 5, background: theme.accent, opacity: 0.5, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />
          );
        }
        return (
          <span key={i} className="desk-ambient-particle"
            style={{ left: `${left}%`, bottom: '0', width: size, height: size, background: theme.accent, opacity: 0.5, animation: `desk-float-up ${dur}s ease-in ${delay}s infinite` }} />
        );
      })}
    </div>
  );
}