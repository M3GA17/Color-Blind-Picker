# Development guide

Color Blind Picker is a Windows desktop app with a Rust core, a Tauri 2 shell and a React / TypeScript interface. The frontend is built with Vite and uses Lucide icons. Windows renders the interface through the system WebView2 runtime.

## Set up

Install Node.js 24, Rust stable with the MSVC toolchain, Microsoft C++ Build Tools and Microsoft Edge WebView2. The [official Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) cover the Windows setup.

```sh
git clone https://github.com/M3GA17/Color-Blind-Picker.git
cd Color-Blind-Picker
npm ci
npm run desktop
```

For a browser-only layout preview, run `npm run dev`. The preview marks itself clearly and disables native actions. It does not sample your screen.

## Build Windows packages

```sh
npm run bundle
```

| Output | Location |
| --- | --- |
| Optimized executable | `src-tauri/target/release/color-blind-picker.exe` |
| Windows installer | `src-tauri/target/release/bundle/nsis/Color Blind Picker_1.0.0_x64-setup.exe` |

The NSIS installer supports Italian and English. Package names follow the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`; keep those versions aligned when releasing.

## Run checks

```sh
npm run build
npm test
npm run test:rust
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

If Playwright's browser is not installed, run `npx playwright install chromium` before `npm test`.

The Rust tests cover the original screenshot colors, neutrals, hue wraparound, input validation, WPF migration and settings/history persistence. Browser tests drive the real React interface through a test implementation of the native bridge, covering capture results, clipboard formatting, pinning, deletion, undo, language changes, errors and keyboard interaction.

### Native Windows smoke test

Close any running instance of Color Blind Picker first, then run:

```sh
npm run tauri -- build --debug --no-bundle
npm run test:native
```

The smoke test launches the actual debug executable and drives WebView2 through a local debugging port. It verifies a known pixel through Windows GDI, a real RGB clipboard write, capture cancellation, pinning, history, deletion, undo, language selection and disk persistence.

It uses a separate data directory, briefly displays a capture surface and replaces the clipboard with an example color. Reports and screenshots are stored under `test-results/native/`. The `CBP_TEST_DATA_DIR` override is debug-only and is absent from release builds.

### Refresh README screenshots

With the debug executable built and the app closed:

```sh
npm run docs:screenshots
```

The script generates the README gallery and cover under `docs/assets/`. It seeds an isolated profile with example colors and captures the real native interface. Live sampling is held at a known example color for consistent images; settings, history, clipboard and actions use the real backend. The capture screenshot places a documentation-only palette behind the actual transparent overlay, so no personal desktop content is recorded. The cover arranges the captured windows alongside the existing app logo.

Generation uses the clipboard for the copy-feedback screenshot. It does not edit production UI code or the user's normal history. The result manifest is saved under `test-results/docs/`.

## Architecture

| Location | Responsibility |
| --- | --- |
| `src/App.tsx` | Compact picker, settings, history and action feedback |
| `src/CaptureOverlay.tsx` | Transparent capture interface and cancellation |
| `src/native.ts` | Typed frontend bridge to Tauri commands and events |
| `src/i18n.ts` | Italian and English interface strings |
| `src/styles.css` | Graphite surfaces, spacing, typography and focus styles |
| `src-tauri/src/color.rs` | RGB/HSL conversion and localized color descriptions |
| `src-tauri/src/platform.rs` | Windows cursor, pixel, desktop bounds and clipboard APIs |
| `src-tauri/src/store.rs` | Settings, color history, atomic writes and legacy import |
| `src-tauri/src/lib.rs` | Native commands, single-instance behavior and capture lifecycle |
| `design/` | Editable SVG design board and design tokens/specifications |
| `tests/` | Browser integration tests |
| `scripts/` | Native smoke test and documentation capture |

The capture surface spans the virtual desktop, including negative monitor origins. The main picker hides during capture and returns when the overlay closes. Saved colors and settings stay in the Rust backend; continuous sampling does not append to history or write to disk.

## Color naming

The core converts 8-bit RGB to HSL, then finds the nearest original hue, lightness and saturation checkpoints. It returns a color name plus a separate qualifier in Italian and English. The hue table retains the terminology of the WPF project; the names are descriptive approximations.

The Windows backend uses GDI desktop RGB values. HDR, color calibration and other operating systems are outside the current implementation.
