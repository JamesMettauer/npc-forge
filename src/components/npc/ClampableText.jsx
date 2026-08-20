import { useState, useLayoutEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Renders text with a line clamp. Shows Expand/Collapse only when the
 * collapsed text actually overflows (measured via scrollHeight vs clientHeight),
 * not based on character count.
 */
export default function ClampableText({ text, emptyText, lines = 3, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (expanded || !text) { setOverflows(false); return; }
    const el = ref.current;
    if (!el) return;
    const check = () => { setOverflows(el.scrollHeight > el.clientHeight + 1); };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded, lines]);

  if (!text) return <p className={`mt-2 text-sm leading-6 italic text-muted-foreground ${className}`}>{emptyText}</p>;

  const showToggle = expanded || overflows;
  const clampStyle = expanded ? undefined : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

  return (
    <>
      <p ref={ref} className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground ${className}`} style={clampStyle}>{text}</p>
      {showToggle && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-1 flex items-center gap-1 text-xs text-brand hover:underline">
          {expanded ? <><ChevronUp size={12}/>Collapse</> : <><ChevronDown size={12}/>Expand</>}
        </button>
      )}
    </>
  );
}