# Color Blind Picker

A small floating Windows utility that describes the color under your pointer in words. Rewritten from WPF in **Rust + Tauri 2**, with a **React / TypeScript** interface based on the Graphite design system.

## Use

Move the pointer outside the picker to identify a screen color continuously. The current color stays unchanged while you interact with the picker itself.

- **Pick a color:** the picker hides and a transparent capture surface covers the desktop. Click to save and copy a color, or press **Esc** to cancel. The click is intercepted, so it does not activate the application underneath.
- **History:** expand the saved colors, copy a value, or open a row's actions to delete it. Deletion can be undone for 10 seconds.
- **Pin:** keep the picker above other windows.
- **Settings:** choose Italian or English and HEX or RGB clipboard output.
- Drag the title bar to move the picker. The red X closes it.

The UI uses compact 10 px insets, neutral surfaces, descriptive names, labeled actions and visible keyboard focus. Live pointer changes are not announced repeatedly to screen readers; explicit action results are.

Screen sampling currently supports **Windows only**, including virtual-desktop coordinates for multiple monitors. The color naming algorithm retains the original WPF hue checkpoints, with separate lightness and saturation descriptions. It reads 8-bit desktop RGB values through Windows GDI; it is not an HDR or color-calibration tool.

## Develop

Install [Rust stable with the MSVC toolchain](https://www.rust-lang.org/tools/install), Node.js 24, Microsoft C++ Build Tools and WebView2. See the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/).

```sh
npm ci
npm run desktop
```

For a browser-only layout preview:

```sh
npm run dev
```

Browser preview explicitly disables desktop actions. The real app uses native Rust commands for sampling, capture, clipboard, settings and history; it does not simulate screen colors.

## Build

```sh
npm run bundle
```

This builds the optimized executable in `src-tauri/target/release/` and the Windows installer in `src-tauri/target/release/bundle/nsis/`. Windows uses the system WebView2 runtime rather than a bundled browser. React renders the interface inside Tauri; React Native is not required. Frontend integration follows the [official Tauri + Vite configuration](https://v2.tauri.app/start/frontend/vite/).

## Verify

```sh
npm run build
npm test
npm run test:rust
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

The Rust tests cover screenshot colors, neutral colors, hue wraparound, invalid input, WPF history migration and persistent settings/deletion/undo. Browser integration tests exercise the actual React interface against a native-command test bridge, including failures, keyboard controls and the capture tooltip.

For an additional **real Windows desktop** smoke test:

```sh
npm run tauri -- build --debug --no-bundle
npm run test:native
```

This launches the debug app with an isolated data directory, drives WebView2 through its local debugging interface, verifies a known pixel through Windows GDI and checks the real RGB clipboard, capture cancellation, settings, history and undo. It briefly opens a capture surface and writes a sample color to the clipboard. Reports and screenshots are saved under `test-results/native/`. The debug-only `CBP_TEST_DATA_DIR` override is absent from release builds.

## Saved data and migration

Settings and the latest 1,000 saved colors are stored in `%APPDATA%/io.github.m3ga17.colorblindpicker/state.json`, using a temporary file and atomic replacement. Failed writes leave the previous in-memory state intact. One running instance owns the data file; launching again focuses the existing picker.

On the first launch, the app imports a WPF `colorList.txt` JSON array if found in the working directory or beside the executable. It preserves the original file, duplicates and color values and displays the newest entries first. To migrate an old installation, place its `colorList.txt` beside the new executable **before the first launch**. Existing new-format data takes precedence. Invalid data is preserved and reported instead of silently overwritten.

## Project layout

- `src/`: React interface, localization, accessible controls and the typed native bridge.
- `src-tauri/src/color.rs`: RGB/HSL conversion and Italian/English color descriptions.
- `src-tauri/src/platform.rs`: Windows cursor, screen pixel, desktop bounds and clipboard access.
- `src-tauri/src/store.rs`: persistent settings, color history and WPF migration.
- `src-tauri/src/lib.rs`: Tauri commands and capture-window lifecycle.
- `design/`: editable Graphite design board and design tokens/component specifications.
- `tests/`: browser integration tests.
- `scripts/smoke-desktop.mjs`: isolated native Windows smoke test.

The old C# / XAML application was removed from the working tree. Its implementation remains available in Git history.
