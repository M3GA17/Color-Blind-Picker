import { createRoot } from 'react-dom/client';
import { App } from './App';
import { CaptureOverlay } from './CaptureOverlay';
import { captureWindow, desktop } from './native';
import './styles.css';

document.documentElement.dataset.surface = captureWindow ? 'capture' : desktop ? 'desktop' : 'preview';
createRoot(document.getElementById('root')!).render(captureWindow ? <CaptureOverlay /> : <App />);
