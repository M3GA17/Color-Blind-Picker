"""Build versioned ISCC–NBS centroid references; never clip them to sRGB.

See docs/COLOR-NAMING.md and docs/data/README.md for sources and limitations.
Use --check to verify checked-in artifacts without changing them.
"""

import argparse
import csv
import hashlib
import json
import re
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", message='"Matplotlib" related API features')

import colour
import numpy as np
import scipy

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/data/iscc-nbs-centroids-source.csv"
METHOD = "iscc-nbs-centroid-ciede2000-v1"
NEUTRAL_AXIS_DELTA_E = 1.5

# Project translations, not official Italian ISCC–NBS designations.
HUES_IT = {
    "pink": "Rosa", "red": "Rosso", "yellowish pink": "Rosa giallastro",
    "reddish orange": "Arancione rossastro", "reddish brown": "Marrone rossastro",
    "orange": "Arancione", "brownish pink": "Rosa brunastro",
    "brownish orange": "Arancione brunastro", "brown": "Marrone",
    "brownish gray": "Grigio brunastro", "brownish black": "Nero brunastro",
    "orange yellow": "Giallo aranciato", "yellowish brown": "Marrone giallastro",
    "yellow brown": "Marrone giallastro", "yellow": "Giallo",
    "yellowish white": "Bianco giallastro", "yellowish gray": "Grigio giallastro",
    "olive brown": "Marrone olivastro", "greenish yellow": "Giallo verdastro",
    "olive": "Oliva", "olive gray": "Grigio olivastro", "olive black": "Nero olivastro",
    "yellow green": "Verde giallo", "yellowish green": "Verde giallastro",
    "olive green": "Verde oliva", "green": "Verde", "greenish white": "Bianco verdastro",
    "greenish gray": "Grigio verdastro", "greenish black": "Nero verdastro",
    "bluish green": "Verde bluastro", "greenish blue": "Blu verdastro", "blue": "Blu",
    "bluish white": "Bianco bluastro", "bluish gray": "Grigio bluastro",
    "bluish black": "Nero bluastro", "purplish blue": "Blu violaceo",
    "violet": "Violetto", "purple": "Viola", "purplish white": "Bianco violaceo",
    "purplish gray": "Grigio violaceo", "purplish black": "Nero violaceo",
    "reddish purple": "Viola rossastro", "purplish pink": "Rosa violaceo",
    "purplish red": "Rosso violaceo", "pinkish white": "Bianco rosato",
    "pinkish gray": "Grigio rosato", "reddish gray": "Grigio rossastro",
    "reddish black": "Nero rossastro", "white": "Bianco", "gray": "Grigio", "black": "Nero",
}
QUALIFIERS_IT = {
    "vivid": "Vivido", "brilliant": "Brillante", "strong": "Intenso", "deep": "Profondo",
    "very deep": "Molto profondo", "light": "Chiaro", "very light": "Molto chiaro",
    "moderate": "Moderato", "dark": "Scuro", "very dark": "Molto scuro", "pale": "Pallido",
    "very pale": "Molto pallido", "grayish": "Grigiastro", "light grayish": "Chiaro e grigiastro",
    "dark grayish": "Scuro e grigiastro", "blackish": "Nerastro", "medium": "Medio", "": "",
}


def text_parts(name):
    for qualifier in sorted(QUALIFIERS_IT, key=len, reverse=True):
        if qualifier and name.startswith(qualifier + " "):
            hue = name[len(qualifier) + 1:]
            if hue in HUES_IT:
                return hue, qualifier
    if name not in HUES_IT:
        raise ValueError(f"Untranslated designation: {name}")
    return name, ""


def normalize_munsell(raw):
    # '+'/'-' indicate uncertainty, '*' an estimated peripheral centroid.
    # Keep the untouched notation in the artifact alongside this central estimate.
    normalized = re.sub(r"[+*\-]", "", raw)
    normalized = normalized.replace("7.PB", "7.0PB")
    if normalized.startswith("N "):
        normalized = normalized.replace("N ", "N").rstrip("/")
    # Colour's parser can accept a prefix of malformed input; validate the whole string.
    if not re.fullmatch(r"(?:N\d+(?:\.\d+)?|\d+(?:\.\d+)?(?:R|YR|Y|GY|G|BG|B|PB|P|RP) \d+(?:\.\d+)?/\d+(?:\.\d+)?)", normalized):
        raise ValueError(f"Unresolved notation: {raw}")
    return normalized


def munsell_to_xyY(notation):
    if notation.startswith("N"):
        return colour.munsell_colour_to_xyY(notation), False
    hue, value_chroma = notation.split()
    value, chroma = map(float, value_chroma.split("/"))
    if value >= 1:
        return colour.munsell_colour_to_xyY(notation), False
    # Four estimated black-tinted centroids have V < 1, outside Colour's interpolator.
    # Extrapolate xy from V=1 and V=2 in ASTM luminance Y; keep the specified chroma.
    # This is a project approximation, explicitly flagged for each reference.
    lower = colour.munsell_colour_to_xyY(f"{hue} 1/{chroma}")
    upper = colour.munsell_colour_to_xyY(f"{hue} 2/{chroma}")
    target_y = float(colour.colorimetry.luminance_ASTMD1535(value)) / 100
    t = (target_y - lower[2]) / (upper[2] - lower[2])
    xy = lower[:2] + t * (upper[:2] - lower[:2])
    return np.array([*xy, target_y]), True


def match_sample(rgb, references):
    space = colour.RGB_COLOURSPACES["sRGB"]
    space.use_derived_transformation_matrices(True)
    lab = colour.XYZ_to_Lab(colour.sRGB_to_XYZ(np.array(rgb) / 255.0), space.whitepoint)
    differences = colour.delta_E(lab, np.array([r["lab_d65"] for r in references]), method="CIE 2000")
    # Project policy: near-axis samples use only the five neutral references.
    achromatic = float(colour.delta_E(lab, [lab[0], 0, 0], method="CIE 2000")) <= NEUTRAL_AXIS_DELTA_E
    candidates = [i for i, r in enumerate(references) if not achromatic or r["id"] >= 263]
    order = sorted(candidates, key=lambda i: (float(differences[i]), references[i]["id"]))
    best, second = [references[i] for i in order[:2]]
    return {
        "hex": "#" + "".join(f"{c:02X}" for c in rgb), "rgb": rgb,
        "name": best["hue"], "description": best["qualifier"],
        "naming": {
            "method": METHOD, "id": best["id"], "referenceName": best["name_en"],
            "deltaE": round(float(differences[order[0]]), 8),
            "alternative": {
                "id": second["id"], "referenceName": second["name_en"],
                "deltaE": round(float(differences[order[1]]), 8),
            },
        },
    }


def generate():
    assert (colour.__version__, np.__version__, scipy.__version__) == ("0.4.6", "2.2.6", "1.15.3")
    rows = list(csv.DictReader(SOURCE.open(encoding="utf-8-sig")))
    assert [int(r["id"]) for r in rows] == list(range(1, 268))
    source_white = colour.notation.munsell.CCS_ILLUMINANT_MUNSELL
    target_white = colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]["D65"]
    assert np.allclose(source_white, [0.31006, 0.31616])
    references = []
    for row in rows:
        ident = int(row["id"])
        if ident == 222:
            continue  # Original notation 6.0P 6.5/7/2 is unresolved; never silently guess 7.2.
        raw = row["munsell"]
        munsell = normalize_munsell(raw)
        hue, qualifier = text_parts(row["name_en"])
        xyY, extrapolated = munsell_to_xyY(munsell)
        xyz_c = colour.xyY_to_XYZ(xyY)
        xyz_d65 = colour.adaptation.chromatic_adaptation_VonKries(
            xyz_c, colour.xy_to_XYZ(source_white), colour.xy_to_XYZ(target_white), transform="Bradford"
        )
        lab = colour.XYZ_to_Lab(xyz_d65, target_white)
        if not np.all(np.isfinite(lab)):
            raise ValueError(f"Non-finite centroid {ident}")
        references.append({
            "id": ident, "name_en": row["name_en"], "munsell_source": raw,
            "munsell": munsell, "estimated": "*" in raw, "source_page": int(row["source_page"]),
            "extrapolated_below_value_one": extrapolated,
            "hue": {"it": HUES_IT[hue], "en": hue.capitalize()},
            "qualifier": {"it": QUALIFIERS_IT[qualifier], "en": qualifier.capitalize()},
            "lab_d65": [round(float(v), 10) for v in lab],
        })
    table = {
        "method": METHOD,
        "source_sha256": hashlib.sha256(SOURCE.read_text(encoding="utf-8-sig").encode("utf-8")).hexdigest(),
        "source": "Kelly, 1958, NBS J. Res. 61(5), pp. 427–431, table 1",
        "conversion": "Colour 0.4.6; Munsell xyY/C -> Bradford XYZ/D65 -> CIELAB/D65; no sRGB clipping",
        "excluded_ids": [222],
        "matching": {"metric": "CIEDE2000", "k_l": 1, "k_c": 1, "k_h": 1,
                     "neutral_axis_delta_e": NEUTRAL_AXIS_DELTA_E, "tie_break": "lower source ID"},
        "references": references,
    }
    previews = [match_sample(rgb, references) for rgb in [[235, 64, 100], [2, 82, 169], [65, 219, 217]]]
    return {
        ROOT / "src-tauri/data/iscc-nbs-v1.json": table,
        ROOT / "src/preview-colors.json": previews,
        ROOT / "tests/data/naming-boundary.json": [
            match_sample([235, 64, 59], references), match_sample([235, 64, 60], references)
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for path, value in generate().items():
        content = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
        if args.check:
            if path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"Out of date: {path.relative_to(ROOT)}")
            print(f"Verified {path.relative_to(ROOT)}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
            print(f"Generated {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
