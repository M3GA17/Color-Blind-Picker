mod math;

use math::{delta_e_2000, srgb_to_lab, Lab};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

pub const NAMING_METHOD: &str = "iscc-nbs-centroid-ciede2000-v1";
const NEUTRAL_AXIS_DELTA_E: f64 = 1.5;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Localized {
    pub it: String,
    pub en: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ReferenceMatch {
    pub id: u16,
    pub reference_name: String,
    pub delta_e: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ColorNaming {
    pub method: String,
    pub id: u16,
    pub reference_name: String,
    pub delta_e: f64,
    pub alternative: ReferenceMatch,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ColorSample {
    pub hex: String,
    pub rgb: [u8; 3],
    /// Source hue and qualifier are split for the compact readout, not reclassified.
    pub name: Localized,
    pub description: Localized,
    pub naming: ColorNaming,
}

#[derive(Debug, Deserialize)]
struct Reference {
    id: u16,
    name_en: String,
    hue: Localized,
    qualifier: Localized,
    lab_d65: Lab,
}

#[derive(Deserialize)]
struct Palette {
    method: String,
    matching: MatchingPolicy,
    references: Vec<Reference>,
}

#[derive(Deserialize)]
struct MatchingPolicy {
    neutral_axis_delta_e: f64,
}

fn references() -> &'static [Reference] {
    static REFERENCES: OnceLock<Vec<Reference>> = OnceLock::new();
    REFERENCES.get_or_init(|| {
        // Generated and checked in; no downloads, external files, or Python at runtime.
        let palette: Palette = serde_json::from_str(include_str!("../data/iscc-nbs-v1.json"))
            .expect("the bundled, versioned ISCC–NBS table must be valid");
        assert_eq!(palette.method, NAMING_METHOD);
        assert_eq!(palette.matching.neutral_axis_delta_e, NEUTRAL_AXIS_DELTA_E);
        assert_eq!(palette.references.len(), 266);
        palette.references
    })
}

pub fn parse_hex(hex: &str) -> Result<[u8; 3], String> {
    let hex = hex.strip_prefix('#').unwrap_or(hex);
    if hex.len() != 6 || !hex.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err("Invalid color: expected six hexadecimal digits.".into());
    }
    let value = u32::from_str_radix(hex, 16).map_err(|e| e.to_string())?;
    Ok([(value >> 16) as u8, (value >> 8) as u8, value as u8])
}

fn nearest_references(lab: Lab, achromatic: bool) -> [(&'static Reference, f64); 2] {
    let references = references();
    let mut first = (&references[0], f64::INFINITY);
    let mut second = first;
    for reference in references {
        // Near-neutral samples use the five published neutral centroids, retaining
        // their original tiny chroma. See the application policy in COLOR-NAMING.md.
        if achromatic && reference.id < 263 {
            continue;
        }
        let distance = delta_e_2000(lab, reference.lab_d65);
        // Strict comparison gives a deterministic lower-ID tie break in source order.
        if distance < first.1 {
            second = first;
            first = (reference, distance);
        } else if distance < second.1 {
            second = (reference, distance);
        }
    }
    [first, second]
}

pub fn describe(rgb: [u8; 3]) -> ColorSample {
    let lab = srgb_to_lab(rgb);
    let achromatic = delta_e_2000(lab, [lab[0], 0.0, 0.0]) <= NEUTRAL_AXIS_DELTA_E;
    let [(best, distance), (second, second_distance)] = nearest_references(lab, achromatic);
    ColorSample {
        hex: format!("#{:02X}{:02X}{:02X}", rgb[0], rgb[1], rgb[2]),
        rgb,
        name: best.hue.clone(),
        description: best.qualifier.clone(),
        naming: ColorNaming {
            method: NAMING_METHOD.into(),
            id: best.id,
            reference_name: best.name_en.clone(),
            delta_e: distance,
            alternative: ReferenceMatch {
                id: second.id,
                reference_name: second.name_en.clone(),
                delta_e: second_distance,
            },
        },
    }
}

pub fn from_hex(hex: &str) -> Result<ColorSample, String> {
    parse_hex(hex).map(describe)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn references_retain_unique_source_ids_and_only_the_documented_exclusion() {
        let ids: Vec<_> = references().iter().map(|r| r.id).collect();
        assert_eq!(ids, (1..=267).filter(|id| *id != 222).collect::<Vec<_>>());
        for reference in references() {
            assert!(reference.lab_d65.iter().all(|v| v.is_finite()));
            assert!(!reference.hue.it.is_empty() && !reference.hue.en.is_empty());
            assert_eq!(
                reference.qualifier.it.is_empty(),
                reference.qualifier.en.is_empty()
            );
            let [(best, distance), _] = nearest_references(reference.lab_d65, false);
            assert_eq!(best.id, reference.id);
            assert!(distance < 1e-10);
        }
    }

    #[test]
    fn brown_pink_and_pale_colors_use_the_reference_nomenclature() {
        // Held-out RGB values, not manually chosen reference swatches. Expected IDs
        // and distances independently calculated with Colour's CIEDE2000 implementation.
        let cases = [
            ("964B00", 55, "Marrone", "Intenso", 5.02205824),
            ("FFC0CB", 4, "Rosa", "Chiaro", 4.29797431),
            ("F5F5DC", 92, "Bianco giallastro", "", 4.96546316),
            ("FFFFE0", 92, "Bianco giallastro", "", 7.29555356),
            ("0000FF", 194, "Blu violaceo", "Vivido", 8.59396385),
            ("8B4513", 55, "Marrone", "Intenso", 2.34975050),
        ];
        for (hex, id, name, description, distance) in cases {
            let color = from_hex(hex).unwrap();
            assert_eq!(color.naming.id, id, "#{hex}");
            assert_eq!(color.name.it, name);
            assert_eq!(color.description.it, description);
            assert!((color.naming.delta_e - distance).abs() < 1e-6);
            assert!(color.naming.alternative.delta_e >= color.naming.delta_e);
        }
    }

    #[test]
    fn gray_ramps_and_one_level_channel_noise_stay_neutral() {
        for channel in 0..=255 {
            let color = describe([channel; 3]);
            assert!(
                (263..=267).contains(&color.naming.id),
                "{channel}: {color:?}"
            );
            assert_eq!(color.rgb, [channel; 3]);
            for index in 0..3 {
                for neighbor in [channel.saturating_sub(1), channel.saturating_add(1)] {
                    let mut rgb = [channel; 3];
                    rgb[index] = neighbor;
                    assert!((263..=267).contains(&describe(rgb).naming.id), "{rgb:?}");
                }
            }
        }
        assert_eq!(describe([0, 0, 0]).name.en, "Black");
        assert_eq!(describe([255, 255, 255]).name.it, "Bianco");
        assert_eq!(describe([128, 128, 128]).description.en, "Medium");
        assert_eq!(describe([127, 127, 128]).name.it, "Grigio");
    }

    #[test]
    fn frontend_examples_match_the_native_classifier_and_preserve_exact_rgb() {
        let examples: Vec<ColorSample> =
            serde_json::from_str(include_str!("../../src/preview-colors.json")).unwrap();
        for expected in examples {
            let actual = describe(expected.rgb);
            assert_eq!(actual.hex, expected.hex);
            assert_eq!(actual.rgb, expected.rgb);
            assert_eq!(actual.name, expected.name);
            assert_eq!(actual.description, expected.description);
            assert_eq!(actual.naming.method, expected.naming.method);
            assert_eq!(actual.naming.id, expected.naming.id);
            assert_eq!(actual.naming.reference_name, expected.naming.reference_name);
            assert_eq!(actual.naming.alternative.id, expected.naming.alternative.id);
            assert!((actual.naming.delta_e - expected.naming.delta_e).abs() < 1e-6);
            assert!(
                (actual.naming.alternative.delta_e - expected.naming.alternative.delta_e).abs()
                    < 1e-6
            );
        }
    }

    #[test]
    fn validates_untrusted_legacy_and_clipboard_values() {
        for invalid in ["", "#123", "FFFFFF00", "GGGGGG", "ééé", "#00ff0g"] {
            assert!(from_hex(invalid).is_err(), "accepted {invalid}");
        }
        assert_eq!(from_hex("#aabbcc").unwrap().hex, "#AABBCC");
    }
}
