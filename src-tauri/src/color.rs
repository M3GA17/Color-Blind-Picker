use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Localized {
    pub it: String,
    pub en: String,
}

impl Localized {
    fn new(it: &str, en: &str) -> Self {
        Self {
            it: it.into(),
            en: en.into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ColorSample {
    pub hex: String,
    pub rgb: [u8; 3],
    pub name: Localized,
    pub description: Localized,
}

const HUES_IT: [&str; 37] = [
    "Rosso",
    "Rosso aranciato",
    "Arancione rossastro",
    "Arancione",
    "Arancione dorato",
    "Giallo aranciato",
    "Giallo",
    "Giallo limone",
    "Giallo verdastro",
    "Verde",
    "Verde primaverile",
    "Verde chiaro",
    "Verde smeraldo",
    "Verde bosco",
    "Verde oliva",
    "Verde acqua",
    "Verde turchese",
    "Azzurro turchese",
    "Ciano",
    "Blu turchese",
    "Blu verdastro",
    "Blu",
    "Blu oceano",
    "Blu reale",
    "Blu notte",
    "Blu indaco",
    "Viola bluastro",
    "Viola",
    "Viola melanzana",
    "Viola ametista",
    "Magenta",
    "Rosa ciclamino",
    "Rosa acceso",
    "Rosso magenta",
    "Rosso rubino",
    "Rosso vivo",
    "Rosso",
];
const HUES_EN: [&str; 37] = [
    "Red",
    "Orange red",
    "Reddish orange",
    "Orange",
    "Golden orange",
    "Yellow orange",
    "Yellow",
    "Lemon yellow",
    "Greenish yellow",
    "Green",
    "Spring green",
    "Light green",
    "Emerald green",
    "Forest green",
    "Olive green",
    "Aqua green",
    "Turquoise green",
    "Turquoise blue",
    "Cyan",
    "Turquoise blue",
    "Greenish blue",
    "Blue",
    "Ocean blue",
    "Royal blue",
    "Midnight blue",
    "Indigo blue",
    "Bluish purple",
    "Purple",
    "Eggplant purple",
    "Amethyst purple",
    "Magenta",
    "Cyclamen pink",
    "Bright pink",
    "Magenta red",
    "Ruby red",
    "Bright red",
    "Red",
];

pub fn parse_hex(hex: &str) -> Result<[u8; 3], String> {
    let hex = hex.strip_prefix('#').unwrap_or(hex);
    if hex.len() != 6 || !hex.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err("Invalid color: expected six hexadecimal digits.".into());
    }
    let value = u32::from_str_radix(hex, 16).map_err(|e| e.to_string())?;
    Ok([(value >> 16) as u8, (value >> 8) as u8, value as u8])
}

fn nearest(value: f64, checkpoints: &[f64]) -> usize {
    let mut closest = 0;
    for index in 1..checkpoints.len() {
        if (value - checkpoints[index]).abs() < (value - checkpoints[closest]).abs() {
            closest = index;
        }
    }
    closest
}

pub fn describe(rgb: [u8; 3]) -> ColorSample {
    let [r, g, b] = rgb.map(|v| f64::from(v) / 255.0);
    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;
    let lightness = (max + min) / 2.0;
    let saturation = if delta == 0.0 {
        0.0
    } else {
        delta / (1.0 - (2.0 * lightness - 1.0).abs())
    };
    let hue = if delta == 0.0 {
        0.0
    } else if max == r {
        (60.0 * ((g - b) / delta)).rem_euclid(360.0)
    } else if max == g {
        60.0 * ((b - r) / delta + 2.0)
    } else {
        60.0 * ((r - g) / delta + 4.0)
    };
    let hue_checkpoints: Vec<f64> = (0..=36).map(|i| f64::from(i) * 10.0).collect();
    let h = nearest(hue, &hue_checkpoints);
    let s = nearest(saturation, &[0.0, 0.25, 0.5, 0.75, 1.0]);
    let l = nearest(lightness, &[0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]);

    let (name, description) = if l == 0 {
        (
            Localized::new("Nero", "Black"),
            Localized::new("Luminosità minima", "Minimum lightness"),
        )
    } else if l == 6 {
        (
            Localized::new("Bianco", "White"),
            Localized::new("Luminosità massima", "Maximum lightness"),
        )
    } else {
        let mut name = if s == 0 {
            Localized::new("Grigio", "Gray")
        } else {
            Localized::new(HUES_IT[h], HUES_EN[h])
        };
        let light_it = ["", "scurissimo", "scuro", "", "chiaro", "chiarissimo", ""];
        let light_en = ["", "very dark", "dark", "", "light", "very light", ""];
        if l != 3 {
            name.it.push_str(&format!(" {}", light_it[l]));
            name.en.push_str(&format!(" {}", light_en[l]));
        }
        let sat_it = [
            "Neutro",
            "Grigiastro",
            "Attenuato",
            "Leggermente attenuato",
            "Intenso",
        ];
        let sat_en = ["Neutral", "Grayish", "Faded", "Slightly faded", "Vivid"];
        (name, Localized::new(sat_it[s], sat_en[s]))
    };
    ColorSample {
        hex: format!("#{:02X}{:02X}{:02X}", rgb[0], rgb[1], rgb[2]),
        rgb,
        name,
        description,
    }
}

pub fn from_hex(hex: &str) -> Result<ColorSample, String> {
    parse_hex(hex).map(describe)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn original_screenshot_colors_keep_their_meaning() {
        let red = from_hex("EB4064").unwrap();
        assert_eq!(red.name.it, "Rosso vivo");
        assert_eq!(red.description.it, "Leggermente attenuato");
        assert_eq!(red.rgb, [235, 64, 100]);
        assert_eq!(from_hex("0252A9").unwrap().name.it, "Blu scuro");
        assert_eq!(from_hex("41DBD9").unwrap().name.it, "Ciano");
    }

    #[test]
    fn handles_neutrals_and_red_hue_wraparound() {
        assert_eq!(describe([0, 0, 0]).name.en, "Black");
        assert_eq!(describe([255, 255, 255]).name.it, "Bianco");
        assert_eq!(describe([128, 128, 128]).name.it, "Grigio");
        assert_eq!(describe([255, 0, 1]).name.en, "Red");
        assert_eq!(describe([255, 1, 0]).name.en, "Red");
        assert_eq!(nearest(5.0, &[0.0, 10.0]), 0);
    }

    #[test]
    fn validates_untrusted_legacy_and_clipboard_values() {
        for invalid in ["", "#123", "FFFFFF00", "GGGGGG", "ééé", "#00ff0g"] {
            assert!(from_hex(invalid).is_err(), "accepted {invalid}");
        }
        assert_eq!(from_hex("#aabbcc").unwrap().hex, "#AABBCC");
    }
}
