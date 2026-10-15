import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, CircleAlert, Copy, Ellipsis, History, LoaderCircle, Pin, Pipette, ScanEye, Settings2, Trash2, X } from 'lucide-react';
import { messages } from './i18n';
import { desktop, native } from './native';
import type { ColorSample, HistoryColor, Settings, Snapshot } from './types';
import { defaultSnapshot, formatColor, initialColor } from './types';

interface Notice { message: string; error?: boolean; detail?: string; undo?: { entry: HistoryColor; index: number } }

export function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>(defaultSnapshot);
  const [current, setCurrent] = useState<ColorSample | null>(desktop ? null : initialColor);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [liveError, setLiveError] = useState(false);
  const container = useRef<HTMLElement>(null);
  const latest = useRef(snapshot);
  const locked = useRef(false);
  const t = messages(snapshot.settings.language);
  latest.current = snapshot;

  async function load() {
    try {
      const next = await native.load();
      setSnapshot(next);
      setReady(true);
      setNotice(null);
    } catch (error) {
      setNotice({ message: messages(latest.current.settings.language).error, detail: String(error), error: true });
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    native.subscribe({
      captured: outcome => {
        const m = messages(outcome.snapshot.settings.language);
        setSnapshot(outcome.snapshot);
        setCurrent(outcome.color);
        setNotice({ message: outcome.copied ? `${m.captured} · ${outcome.snapshot.settings.format.toUpperCase()} ${m.andCopied}` : `${m.captured} · ${m.copyFailed}`, error: !outcome.copied, detail: outcome.copyError ?? undefined });
      },
      closed: () => setCapturing(false),
      error: error => setNotice({ message: messages(latest.current.settings.language).error, detail: error, error: true }),
    }).then(dispose => { if (disposed) dispose(); else unlisten = dispose; }).catch(error => {
      setNotice({ message: messages(latest.current.settings.language).error, detail: String(error), error: true });
    });
    return () => { disposed = true; unlisten?.(); };
  }, []);

  useEffect(() => {
    if (!ready || !desktop || capturing) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const sample = async () => {
      try {
        const color = await native.sample();
        if (!disposed) {
          if (color) setCurrent(previous => previous?.hex === color.hex ? previous : color);
          setLiveError(false);
        }
      } catch { if (!disposed) setLiveError(true); }
      if (!disposed) timer = setTimeout(() => { void sample(); }, 120);
    };
    void sample();
    return () => { disposed = true; clearTimeout(timer); };
  }, [ready, capturing]);

  useEffect(() => {
    if (!container.current || !desktop) return;
    let stopped = false;
    let frame = 0;
    let previousHeight = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = Math.ceil(container.current?.getBoundingClientRect().height ?? 200);
        if (stopped || height === previousHeight) return;
        previousHeight = height;
        native.resize(380, height).catch(error => {
          if (!stopped) setNotice({ message: messages(latest.current.settings.language).error, detail: String(error), error: true });
        });
      });
    });
    observer.observe(container.current);
    return () => { stopped = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  useEffect(() => { document.documentElement.lang = snapshot.settings.language; }, [snapshot.settings.language]);

  useEffect(() => {
    if (!notice || notice.error) return;
    const timer = setTimeout(() => setNotice(null), notice.undo ? 10000 : 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (menu !== null) setMenu(null); else setSettingsOpen(false); }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('[data-history-menu]')) setMenu(null);
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside); };
  }, [menu]);

  async function action(work: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try { await work(); }
    catch (error) { setNotice({ message: t.error, detail: String(error), error: true }); }
    finally { locked.current = false; setPending(false); }
  }

  function changeSettings(patch: Partial<Settings>) {
    void action(async () => {
      const next = await native.settings({ ...latest.current.settings, ...patch });
      setSnapshot(next);
      if (patch.alwaysOnTop !== undefined) setNotice({ message: patch.alwaysOnTop ? t.pinned : t.unpinned });
    });
  }

  function copy(color: ColorSample) {
    void action(async () => {
      await native.copy(color.hex);
      setNotice({ message: `${formatColor(color, latest.current.settings.format)} · ${t.copied}` });
    });
  }

  function remove(entry: HistoryColor, index: number) {
    void action(async () => {
      setSnapshot(await native.remove(entry.id));
      setMenu(null);
      setNotice({ message: t.deleted, undo: { entry, index } });
    });
  }

  const controlsDisabled = !desktop || !ready || pending || capturing;
  const language = snapshot.settings.language;
  const colorName = current?.name[language] ?? t.waiting;

  return <main className="picker" ref={container} aria-label="Color Blind Picker">
    <header className="titlebar" onPointerDown={event => {
      if (event.button === 0 && event.target instanceof Element && !event.target.closest('button')) {
        void native.drag().catch(error => setNotice({ message: t.error, detail: String(error), error: true }));
      }
    }}>
      <span className={`live-status${liveError ? ' is-error' : ''}`}>
        {liveError ? <CircleAlert size={14} /> : <ScanEye size={14} />}
        {liveError ? t.unavailable : t.live}
      </span>
      <div className="window-controls">
        <button className="icon-button" aria-label={t.settings} title={t.settings} aria-expanded={settingsOpen} aria-controls="settings-panel" onClick={() => setSettingsOpen(value => !value)}><Settings2 /></button>
        <button className="icon-button close-button" aria-label={t.close} title={t.close} onClick={() => { void action(native.close); }}><X /></button>
      </div>
    </header>

    <section className="readout" aria-label={colorName}>
      <div className={`swatch${!current ? ' swatch-empty' : ''}`} style={current ? { backgroundColor: current.hex } : undefined} aria-hidden="true" />
      <div className="color-info">
        <h1>{!ready ? t.loading : colorName}</h1>
        <div className="color-description">{current?.description[language] ?? t.waitingHint}</div>
        {current && <button className="color-code" disabled={controlsDisabled} aria-label={`${t.copy} ${formatColor(current, snapshot.settings.format)}`} title={t.copy} onClick={() => copy(current)}>
          <span>{formatColor(current, snapshot.settings.format)}</span><Copy size={14} />
        </button>}
      </div>
    </section>

    <div className="actions">
      <button className="button primary" disabled={controlsDisabled} title={`${t.captureHint} · ${t.escape}`} onClick={() => { void action(async () => {
        setCapturing(true);
        setNotice(null);
        try { await native.beginCapture(); } catch (error) { setCapturing(false); throw error; }
      }); }}>
        {capturing ? <LoaderCircle className="spinner" /> : <Pipette />}<span>{t.capture}</span>
      </button>
      <button className="button" disabled={controlsDisabled} aria-expanded={snapshot.settings.historyOpen} aria-controls="history-panel" onClick={() => changeSettings({ historyOpen: !snapshot.settings.historyOpen })}>
        <History /><span>{t.history}</span>{snapshot.settings.historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <button className="button pin-button" disabled={controlsDisabled} aria-label={t.pin} title={t.pin} aria-pressed={snapshot.settings.alwaysOnTop} onClick={() => changeSettings({ alwaysOnTop: !snapshot.settings.alwaysOnTop })}>
        <Pin fill={snapshot.settings.alwaysOnTop ? 'currentColor' : 'none'} />
      </button>
    </div>

    {settingsOpen && <section id="settings-panel" className="settings-panel" aria-label={t.settings}>
      <h2>{t.settings}</h2>
      <label>{t.language}<select value={language} disabled={controlsDisabled} onChange={event => {
        const value = event.target.value;
        if (value === 'it' || value === 'en') changeSettings({ language: value });
      }}><option value="it">Italiano</option><option value="en">English</option></select></label>
      <label>{t.format}<select value={snapshot.settings.format} disabled={controlsDisabled} onChange={event => {
        const value = event.target.value;
        if (value === 'hex' || value === 'rgb') changeSettings({ format: value });
      }}><option value="hex">HEX</option><option value="rgb">RGB</option></select></label>
    </section>}

    {snapshot.settings.historyOpen && <section className="history-panel" id="history-panel" aria-label={t.history}>
      <div className="history-heading"><h2>{t.saved}</h2><span>{snapshot.history.length} {snapshot.history.length === 1 ? t.color : t.colors}</span></div>
      <div className="history-list">
        {!snapshot.history.length && <div className="empty-history"><History size={22} /><p>{t.empty}</p><span>{t.emptyHint}</span></div>}
        {snapshot.history.map((entry, index) => <div className="history-entry" key={entry.id}>
          <div className="history-row">
            <span className="mini-swatch" style={{ backgroundColor: entry.color.hex }} aria-hidden="true" />
            <div className="history-color"><div>{entry.color.name[language]}</div><span>{entry.color.hex}</span></div>
            <button className="icon-button" disabled={controlsDisabled} aria-label={`${t.copy} ${entry.color.name[language]}`} title={t.copy} onClick={() => copy(entry.color)}><Copy /></button>
            <div data-history-menu><button className="icon-button" disabled={controlsDisabled} aria-label={`${t.more}: ${entry.color.name[language]}`} title={t.more} aria-expanded={menu === entry.id} aria-controls={`color-actions-${entry.id}`} onClick={() => setMenu(value => value === entry.id ? null : entry.id)}><Ellipsis /></button></div>
          </div>
          {menu === entry.id && <div className="row-actions" id={`color-actions-${entry.id}`} data-history-menu><button className="button destructive" disabled={controlsDisabled} onClick={() => remove(entry, index)}><Trash2 />{t.remove}</button></div>}
        </div>)}
      </div>
    </section>}

    {notice && <div className={`notice${notice.error ? ' notice-error' : ''}`} role={notice.error ? 'alert' : 'status'}>
      {notice.error ? <CircleAlert size={15} /> : <Check size={15} />}
      <div><span>{notice.message}</span>{notice.detail && <details><summary>{language === 'it' ? 'Dettagli' : 'Details'}</summary>{notice.detail}</details>}</div>
      {notice.undo && <button className="text-button" disabled={pending} onClick={() => { const undo = notice.undo; if (undo) void action(async () => {
        setSnapshot(await native.restore(undo.entry, undo.index));
        setNotice({ message: t.restored });
      }); }}>{t.undo}</button>}
      {!ready && <button className="text-button" onClick={() => { void load(); }}>{t.retry}</button>}
    </div>}
    {!desktop && <div className="preview-note">{t.webPreview}</div>}
  </main>;
}
