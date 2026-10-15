mod color;
mod platform;
mod store;

use color::ColorSample;
use serde::Serialize;
use store::{Repository, SavedColor, Settings, Snapshot};
use tauri::{
    Emitter, Manager, PhysicalPosition, PhysicalSize, State, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureOutcome {
    color: ColorSample,
    snapshot: Snapshot,
    copied: bool,
    copy_error: Option<String>,
}

#[tauri::command]
fn load_state(repository: State<Repository>) -> Result<Snapshot, String> {
    Ok(repository.read()?.snapshot())
}

#[tauri::command]
fn sample_color(app: tauri::AppHandle) -> Result<Option<ColorSample>, String> {
    let point = platform::cursor()?;
    if let Some(main) = app.get_webview_window("main") {
        if main.is_visible().unwrap_or(false) {
            let origin = main.outer_position().map_err(|e| e.to_string())?;
            let size = main.outer_size().map_err(|e| e.to_string())?;
            if point.x >= origin.x
                && point.y >= origin.y
                && i64::from(point.x) < i64::from(origin.x) + i64::from(size.width)
                && i64::from(point.y) < i64::from(origin.y) + i64::from(size.height)
            {
                return Ok(None);
            }
        }
    }
    platform::pixel(point).map(|rgb| Some(color::describe(rgb)))
}

#[tauri::command]
fn set_settings(
    settings: Settings,
    app: tauri::AppHandle,
    repository: State<Repository>,
) -> Result<Snapshot, String> {
    let previous = repository.read()?.settings;
    let window = app
        .get_webview_window("main")
        .ok_or("Main window unavailable.")?;
    window
        .set_always_on_top(settings.always_on_top)
        .map_err(|e| e.to_string())?;
    let result = repository.update(|data| {
        data.settings = settings;
        Ok(())
    });
    if result.is_err() {
        let _ = window.set_always_on_top(previous.always_on_top);
    }
    result
}

#[tauri::command]
fn copy_color(hex: String, repository: State<Repository>) -> Result<(), String> {
    let color = color::from_hex(&hex)?;
    let settings = repository.read()?.settings;
    platform::copy(store::copy_value(&color, settings.format))
}

#[tauri::command]
fn delete_color(id: u64, repository: State<Repository>) -> Result<Snapshot, String> {
    repository.update(|data| {
        if !data.history.iter().any(|c| c.id == id) {
            return Err("Saved color no longer exists.".into());
        }
        data.history.retain(|color| color.id != id);
        Ok(())
    })
}

#[tauri::command]
fn restore_color(
    saved: SavedColor,
    index: usize,
    repository: State<Repository>,
) -> Result<Snapshot, String> {
    repository.update(|data| {
        if data.history.iter().any(|c| c.id == saved.id) {
            return Err("This color has already been restored.".into());
        }
        let index = index.min(data.history.len());
        data.history.insert(index, saved);
        Ok(())
    })
}

#[tauri::command]
async fn begin_capture(app: tauri::AppHandle) -> Result<(), String> {
    if app.get_webview_window("capture").is_some() {
        return Err("Capture is already active.".into());
    }
    let bounds = platform::bounds()?;
    let main = app
        .get_webview_window("main")
        .ok_or("Main window unavailable.")?;
    let overlay = WebviewWindowBuilder::new(&app, "capture", WebviewUrl::App("index.html".into()))
        .title("Color Blind Picker · Capture")
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .visible(false)
        .build()
        .map_err(|e| e.to_string())?;
    let app_for_close = app.clone();
    overlay.on_window_event(move |event| {
        if matches!(event, tauri::WindowEvent::Destroyed) {
            if let Some(main) = app_for_close.get_webview_window("main") {
                let _ = main.show();
                let _ = main.set_focus();
                let _ = main.emit("capture-closed", ());
            }
        }
    });
    let show = || -> Result<(), String> {
        overlay
            .set_position(PhysicalPosition::new(bounds.x, bounds.y))
            .map_err(|e| e.to_string())?;
        overlay
            .set_size(PhysicalSize::new(bounds.width, bounds.height))
            .map_err(|e| e.to_string())?;
        main.hide().map_err(|e| e.to_string())?;
        overlay.show().map_err(|e| e.to_string())?;
        overlay.set_focus().map_err(|e| e.to_string())
    };
    if let Err(error) = show() {
        let _ = overlay.close();
        let _ = main.show();
        return Err(error);
    }
    Ok(())
}

#[tauri::command]
fn finish_capture(window: WebviewWindow, repository: State<Repository>) -> Result<(), String> {
    if window.label() != "capture" {
        return Err("Capture window required.".into());
    }
    let result = (|| {
        let color = color::describe(platform::pixel(platform::cursor()?)?);
        let snapshot = repository.update(|data| {
            data.add(&color);
            Ok(())
        })?;
        let copy_result = platform::copy(store::copy_value(&color, snapshot.settings.format));
        let outcome = CaptureOutcome {
            color,
            snapshot,
            copied: copy_result.is_ok(),
            copy_error: copy_result.err(),
        };
        if let Some(main) = window.app_handle().get_webview_window("main") {
            main.emit("color-captured", outcome)
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    })();
    // Always restore the main window, including clipboard and disk failures.
    let close_result = window.close().map_err(|e| e.to_string());
    if let Err(ref message) = result {
        if let Some(main) = window.app_handle().get_webview_window("main") {
            let _ = main.emit("capture-error", message);
        }
    }
    result.and(close_result)
}

#[tauri::command]
fn cancel_capture(window: WebviewWindow) -> Result<(), String> {
    if window.label() != "capture" {
        return Err("Capture window required.".into());
    }
    window.close().map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app
                .get_webview_window("capture")
                .or_else(|| app.get_webview_window("main"))
            {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            let directory = app.path().app_data_dir()?;
            // Isolate native smoke tests without adding a production data-path override.
            #[cfg(debug_assertions)]
            let directory = std::env::var_os("CBP_TEST_DATA_DIR")
                .map(std::path::PathBuf::from)
                .unwrap_or(directory);
            let path = store::data_path(&directory);
            let repository =
                Repository::open(path, &store::legacy_paths()).map_err(std::io::Error::other)?;
            if let Some(main) = app.get_webview_window("main") {
                main.set_always_on_top(
                    repository
                        .read()
                        .map_err(std::io::Error::other)?
                        .settings
                        .always_on_top,
                )?;
            }
            app.manage(repository);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_state,
            sample_color,
            set_settings,
            copy_color,
            delete_color,
            restore_color,
            begin_capture,
            finish_capture,
            cancel_capture
        ])
        .run(tauri::generate_context!())
        .expect("Unable to start Color Blind Picker");
}
