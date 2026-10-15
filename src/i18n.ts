import type { Language } from './types';

const it = {
  live: 'In tempo reale', settings: 'Impostazioni', close: 'Chiudi', capture: 'Cattura colore',
  history: 'Cronologia', pin: 'Sempre in primo piano', saved: 'Colori salvati', colors: 'colori', color: 'colore',
  copy: 'Copia', copied: 'Copiato', more: 'Altre azioni', remove: 'Elimina colore',
  deleted: 'Colore eliminato', undo: 'Annulla', restored: 'Colore ripristinato',
  language: 'Lingua', format: 'Formato copia', empty: 'Nessun colore salvato.',
  emptyHint: 'Cattura il primo colore per ritrovarlo qui.',
  captured: 'Colore salvato', andCopied: 'copiato', copyFailed: 'Copia non riuscita. Riprova.',
  captureHint: 'Clic per catturare', escape: 'Esc per annullare', loading: 'Avvio…',
  unavailable: 'Rilevamento non disponibile', retry: 'Riprova',
  webPreview: 'Anteprima web · il campionamento richiede l’app desktop',
  error: 'Operazione non riuscita', pinned: 'Finestra in primo piano', unpinned: 'Finestra non fissata',
  waiting: 'Sposta il cursore', waitingHint: 'Su un colore fuori da questa finestra',
};
type Messages = typeof it;
const en: Messages = {
  live: 'Live detection', settings: 'Settings', close: 'Close', capture: 'Pick a color',
  history: 'History', pin: 'Always on top', saved: 'Saved colors', colors: 'colors', color: 'color',
  copy: 'Copy', copied: 'Copied', more: 'More actions', remove: 'Delete color',
  deleted: 'Color deleted', undo: 'Undo', restored: 'Color restored',
  language: 'Language', format: 'Copy format', empty: 'No saved colors yet.',
  emptyHint: 'Pick your first color to find it here.',
  captured: 'Color saved', andCopied: 'copied', copyFailed: 'Could not copy. Try again.',
  captureHint: 'Click to pick', escape: 'Esc to cancel', loading: 'Starting…',
  unavailable: 'Detection unavailable', retry: 'Retry',
  webPreview: 'Web preview · screen sampling requires the desktop app',
  error: 'The action failed', pinned: 'Always on top enabled', unpinned: 'Always on top disabled',
  waiting: 'Move the pointer', waitingHint: 'Over a color outside this window',
};
export function messages(language: Language): Messages { return language === 'it' ? it : en; }
