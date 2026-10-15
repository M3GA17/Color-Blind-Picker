import { useEffect, useRef, useState } from 'react';
import { CircleAlert, MousePointer2 } from 'lucide-react';
import { messages } from './i18n';
import { native } from './native';
import type { ColorSample, Language } from './types';

export function CaptureOverlay() {
  const [language, setLanguage] = useState<Language>('it');
  const [color, setColor] = useState<ColorSample | null>(null);
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
        if (!disposed) { setColor(sample); setError(false); }
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

  return <div className="capture-surface" onContextMenu={event => event.preventDefault()} onPointerMove={event => setPoint({ x: event.clientX, y: event.clientY })} onPointerDown={event => {
    if (event.button !== 0 || selecting.current) return;
    event.preventDefault();
    selecting.current = true;
    void native.finishCapture().catch(() => { selecting.current = false; setError(true); });
  }}>
    <div className="capture-instructions"><MousePointer2 size={16} /><span>{t.captureHint}</span><kbd>Esc</kbd><span>{language === 'it' ? 'per annullare' : 'to cancel'}</span></div>
    {point && <div className="capture-tooltip" style={{ left: Math.max(8, point.x + 272 > window.innerWidth ? point.x - 272 : point.x + 24), top: Math.max(8, point.y + 90 > window.innerHeight ? point.y - 90 : point.y + 24) }}>
      {color && <><span className="mini-swatch" style={{ backgroundColor: color.hex }} /><div><strong>{color.name[language]}</strong><span>{color.hex}</span></div></>}
      {error && <span className="capture-error"><CircleAlert size={16} />{t.unavailable}</span>}
    </div>}
  </div>;
}
