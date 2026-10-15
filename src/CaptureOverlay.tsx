import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CircleAlert, MousePointer2 } from 'lucide-react';
import { messages } from './i18n';
import { native } from './native';
import { LiveLabel } from './live-label';
import { colorLabel } from './types';
import type { ColorSample, Language } from './types';

export function CaptureOverlay() {
  const [language, setLanguage] = useState<Language>('it');
  const [color, setColor] = useState<ColorSample | null>(null);
  const [label, setLabel] = useState<ColorSample | null>(null);
  const liveLabel = useRef(new LiveLabel());
  const tooltip = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(80);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState(false);
  const selecting = useRef(false);
  const t = messages(language);

  useEffect(() => {
    void native.load().then(state => setLanguage(state.settings.language)).catch(() => {});
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const sample = async () => {
      try {
        const sample = await native.sample();
        if (!disposed) {
          setColor(sample);
          if (sample) setLabel(liveLabel.current.update(sample, performance.now()));
          else { liveLabel.current.reset(); setLabel(null); }
          setError(false);
        }
      } catch { if (!disposed) setError(true); }
      if (!disposed) timer = setTimeout(() => { void sample(); }, 80);
    };
    void sample();
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !selecting.current) {
        selecting.current = true;
        void native.cancelCapture().catch(() => { selecting.current = false; setError(true); });
      }
    };
    window.addEventListener('keydown', cancel);
    return () => { disposed = true; clearTimeout(timer); window.removeEventListener('keydown', cancel); };
  }, []);

  const showingTooltip = point !== null;
  useLayoutEffect(() => {
    if (!tooltip.current) return;
    const update = () => setTooltipHeight(Math.ceil(tooltip.current?.getBoundingClientRect().height ?? 80));
    const observer = new ResizeObserver(update);
    observer.observe(tooltip.current);
    update();
    return () => observer.disconnect();
  }, [showingTooltip]);

  return <div className="capture-surface" onContextMenu={event => event.preventDefault()} onPointerMove={event => setPoint({ x: event.clientX, y: event.clientY })} onPointerDown={event => {
    if (event.button !== 0 || selecting.current) return;
    event.preventDefault();
    selecting.current = true;
    void native.finishCapture().catch(() => { selecting.current = false; setError(true); });
  }}>
    <div className="capture-instructions"><MousePointer2 size={16} /><span>{t.captureHint}</span><kbd>Esc</kbd><span>{language === 'it' ? 'per annullare' : 'to cancel'}</span></div>
    {point && <div ref={tooltip} className="capture-tooltip" style={{ left: Math.max(8, point.x + 272 > window.innerWidth ? point.x - 272 : point.x + 24), top: Math.max(8, point.y + tooltipHeight + 24 > window.innerHeight ? point.y - tooltipHeight - 24 : point.y + 24) }}>
      {color && label && <><span className="mini-swatch" style={{ backgroundColor: color.hex }} /><div><strong>{colorLabel(label, language)}</strong><span>{color.hex}</span></div></>}
      {error && <span className="capture-error"><CircleAlert size={16} />{t.unavailable}</span>}
    </div>}
  </div>;
}
