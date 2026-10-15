use crate::color::{from_hex, parse_hex, ColorSample};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};

const MAX_COLORS: usize = 1000;

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    #[default]
    It,
    En,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CopyFormat {
    #[default]
    Hex,
    Rgb,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub language: Language,
    pub format: CopyFormat,
    pub always_on_top: bool,
    pub history_open: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedColor {
    pub id: u64,
    pub hex: String,
    pub captured_at: u64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppData {
    pub settings: Settings,
    pub history: Vec<SavedColor>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryColor {
    pub id: u64,
    pub color: ColorSample,
    pub captured_at: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub settings: Settings,
    pub history: Vec<HistoryColor>,
}

impl AppData {
    pub fn snapshot(&self) -> Snapshot {
        Snapshot {
            settings: self.settings.clone(),
            history: self
                .history
                .iter()
                .filter_map(|saved| {
                    from_hex(&saved.hex).ok().map(|color| HistoryColor {
                        id: saved.id,
                        color,
                        captured_at: saved.captured_at,
                    })
                })
                .collect(),
        }
    }

    pub fn add(&mut self, color: &ColorSample) {
        let time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        let id = self
            .history
            .iter()
            .map(|c| c.id)
            .max()
            .unwrap_or(0)
            .saturating_add(1)
            .max(time);
        self.history.insert(
            0,
            SavedColor {
                id,
                hex: color.hex.clone(),
                captured_at: time,
            },
        );
        self.history.truncate(MAX_COLORS);
    }
}

pub struct Repository {
    path: PathBuf,
    data: Mutex<AppData>,
}

impl Repository {
    pub fn open(path: PathBuf, legacy_paths: &[PathBuf]) -> Result<Self, String> {
        let data = if path.exists() {
            let bytes = fs::read(&path).map_err(|e| format!("Cannot read saved colors: {e}"))?;
            let data: AppData = serde_json::from_slice(&bytes).map_err(|e| {
                format!(
                    "Invalid saved data (file preserved at {}): {e}",
                    path.display()
                )
            })?;
            validate(&data)?;
            data
        } else {
            let mut data = AppData::default();
            for legacy in legacy_paths {
                if legacy.exists() {
                    let bytes =
                        fs::read(legacy).map_err(|e| format!("Cannot read old history: {e}"))?;
                    data = import_legacy(&bytes)?;
                    break;
                }
            }
            data
        };
        let repository = Self {
            path,
            data: Mutex::new(data),
        };
        if !repository.path.exists() {
            repository.write(&repository.read()?)?;
        }
        Ok(repository)
    }

    pub fn read(&self) -> Result<AppData, String> {
        self.data
            .lock()
            .map(|data| data.clone())
            .map_err(|_| "Saved data is unavailable.".into())
    }

    pub fn update(
        &self,
        change: impl FnOnce(&mut AppData) -> Result<(), String>,
    ) -> Result<Snapshot, String> {
        let mut data = self.data.lock().map_err(|_| "Saved data is unavailable.")?;
        let mut next = data.clone();
        change(&mut next)?;
        validate(&next)?;
        self.write(&next)?;
        *data = next;
        Ok(data.snapshot())
    }

    fn write(&self, data: &AppData) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let temp = self.path.with_extension("json.tmp");
        let bytes = serde_json::to_vec_pretty(data).map_err(|e| e.to_string())?;
        let mut file = fs::File::create(&temp).map_err(|e| format!("Cannot save colors: {e}"))?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|e| format!("Cannot save colors: {e}"))?;
        drop(file);
        fs::rename(&temp, &self.path).map_err(|e| format!("Cannot replace saved colors: {e}"))
    }
}

fn validate(data: &AppData) -> Result<(), String> {
    if data.history.len() > MAX_COLORS {
        return Err("History contains too many colors.".into());
    }
    let mut ids = std::collections::HashSet::new();
    for saved in &data.history {
        // Validation needs only the encoded value; naming is derived in snapshot().
        parse_hex(&saved.hex)?;
        if !ids.insert(saved.id) {
            return Err("History contains duplicate identifiers.".into());
        }
    }
    Ok(())
}

pub fn import_legacy(bytes: &[u8]) -> Result<AppData, String> {
    let colors: Vec<String> = serde_json::from_slice(bytes)
        .map_err(|e| format!("Invalid old colorList.txt (original preserved): {e}"))?;
    let mut data = AppData::default();
    // The WPF list was oldest first. Preserve its order when displaying newest first.
    for hex in colors {
        data.add(&from_hex(&hex)?);
    }
    Ok(data)
}

pub fn legacy_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        paths.push(cwd.join("colorList.txt"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            let path = parent.join("colorList.txt");
            if !paths.contains(&path) {
                paths.push(path);
            }
        }
    }
    paths
}

pub fn copy_value(color: &ColorSample, format: CopyFormat) -> String {
    match format {
        CopyFormat::Hex => color.hex.clone(),
        CopyFormat::Rgb => format!("rgb({}, {}, {})", color.rgb[0], color.rgb[1], color.rgb[2]),
    }
}

pub fn data_path(directory: &Path) -> PathBuf {
    directory.join("state.json")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrates_wpf_history_without_losing_duplicates_or_order() {
        let data = import_legacy(br##"["EB4064","0252A9","EB4064"]"##).unwrap();
        assert_eq!(
            data.history
                .iter()
                .map(|c| c.hex.as_str())
                .collect::<Vec<_>>(),
            ["#EB4064", "#0252A9", "#EB4064"]
        );
        validate(&data).unwrap();
        assert_eq!(data.snapshot().history[0].color.naming.id, 3);
        assert!(import_legacy(br##"["invalid"]"##).is_err());
    }

    #[test]
    fn persists_settings_deletion_and_undo_across_restarts() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let directory =
            std::env::temp_dir().join(format!("cbp-store-test-{}-{unique}", std::process::id()));
        let path = data_path(&directory);
        let repo = Repository::open(path.clone(), &[]).unwrap();
        let snapshot = repo
            .update(|data| {
                data.settings.language = Language::En;
                data.add(&from_hex("0252A9")?);
                Ok(())
            })
            .unwrap();
        let saved = repo.read().unwrap().history[0].clone();
        repo.update(|data| {
            data.history.retain(|c| c.id != saved.id);
            Ok(())
        })
        .unwrap();
        assert!(repo.read().unwrap().history.is_empty());
        repo.update(|data| {
            data.history.insert(0, saved);
            Ok(())
        })
        .unwrap();
        let reopened = Repository::open(path, &[]).unwrap().read().unwrap();
        assert_eq!(reopened.history.len(), snapshot.history.len());
        assert_eq!(reopened.snapshot().history[0].color.naming.id, 182);
        assert!(matches!(reopened.settings.language, Language::En));
        // Delete only this test's verified unique temporary directory.
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn failed_update_keeps_the_previous_data() {
        let repo = Repository {
            path: PathBuf::from("unused"),
            data: Mutex::new(AppData::default()),
        };
        assert!(repo
            .update(|data| {
                data.settings.always_on_top = true;
                Err("failure".into())
            })
            .is_err());
        assert!(!repo.read().unwrap().settings.always_on_top);
        let color = from_hex("#eb4064").unwrap();
        assert_eq!(copy_value(&color, CopyFormat::Hex), "#EB4064");
        assert_eq!(copy_value(&color, CopyFormat::Rgb), "rgb(235, 64, 100)");
    }
}
