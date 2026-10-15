# Color naming in the Rust edition

Implemented method: **`iscc-nbs-centroid-ciede2000-v1`**. This replaces the WPF-derived HSL checkpoints with a deterministic, offline **ISCC–NBS-based nearest-centroid approximation**. It does not claim exact reproduction of the original naming regions or ISO certification.

## What changed

The old classifier rounded hue to 10-degree checkpoints and chose separate HSL lightness/saturation bins. This could describe brown as dark orange, light pink as very light red, and pale colors as vivid because HSL saturation is not perceptual colorfulness.

The new classifier chooses a published reference designation as a whole. Its hue and qualifier are then split across the compact readout; no independent lightness or intensity thresholds are added. History and capture show both parts. Original English names and designation IDs remain available in the native response and in hover text on the main name/history label. Italian labels are project translations, not an official translated edition.

| Sample | Previous Italian readout | New Italian readout | Reference |
| --- | --- | --- | --- |
| `#964B00` | Arancione scuro · Intenso | Marrone · Intenso | 55, strong brown |
| `#FFC0CB` | Rosso vivo chiarissimo · Intenso | Rosa · Chiaro | 4, light pink |
| `#F5F5DC` | Giallo chiarissimo · Attenuato | Bianco giallastro | 92, yellowish white |
| `#FFFFE0` | Giallo chiarissimo · Intenso | Bianco giallastro | 92, yellowish white |
| `#0000FF` | Blu notte · Intenso | Blu violaceo · Vivido | 194, vivid purplish blue |
| `#EB4064` | Rosso vivo · Leggermente attenuato | Rosa · Profondo | 3, deep pink |
| `#0252A9` | Blu scuro · Intenso | Blu · Moderato | 182, moderate blue |
| `#41DBD9` | Ciano · Leggermente attenuato | Verde bluastro · Brillante | 159, brilliant bluish green |

These are regression examples, not evidence of a measured percentage improvement in human naming accuracy. Historical ISCC–NBS terms can differ from everyday usage and CSS keywords: for example this method assigns `#FF0000` to **vivid reddish orange**, and `#F5F5DC` to **yellowish white**, rather than promising the CSS names `red` and `beige`. Adding undocumented exceptions to force CSS agreement would mix two vocabularies.

## Why these references

ISCC–NBS describes named color regions using Munsell hue, value and chroma. Kelly's 1958 paper publishes central notations for the revised 1955 blocks, while explaining that centroid matching is less exact than the original boundary charts. We chose the published centroids because they support a small, reproducible offline implementation; a verified conversion to every original region is not available in this implementation. [Kelly, 1958](https://nvlpubs.nist.gov/nistpubs/jres/61/jresv61n5p427_A1b.pdf)

CIEDE2000 was chosen for comparisons because it is a documented color-difference formula in ISO/CIE 11664-6:2022. It does **not** standardize nearest-centroid naming. Oklab remains a reasonable alternative, but was not combined with a custom naming palette. CSS names are appropriate for web interoperability; NCS, RAL and Pantone would target particular professional catalogs and licensing arrangements. The [research comparison](COLOR-NAMING-RESEARCH.md) records these alternatives. [ISO/CIE publication](https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula-1)

## Source data and conversion

The [source CSV](data/iscc-nbs-centroids-source.csv) preserves all **267** designation numbers, English labels, printed Munsell notations and source pages. The [data provenance note](data/README.md) records the source PDF checksum, uncertainties and transcription changes. No third-party RGB palette was used.

`scripts/generate-color-data.py` produces the checked-in reference table, browser examples and boundary fixtures using **Colour 0.4.6, NumPy 2.2.6 and SciPy 1.15.3**:

1. Preserve original notation separately. Remove uncertainty markers `+`/`-` and estimated-sample marker `*` only from the numerical central estimate. Interpret the literal `7.PB` at ID 198 as `7.0PB`; normalize neutral notation such as `N 3.5/` to `N3.5`.
2. Exclude **ID 222, light purple** from numerical matching: its printed `6.0P 6.5/7/2` cannot be resolved without guessing. The source category remains in the CSV; the runtime table has **266 usable references**. ID 222 cannot be returned by this version.
3. Convert Munsell to CIE xyY under illuminant C using Colour's renotation interpolation and ASTM D1535 luminance relation. Its implementation already applies the luminance normalization; do not multiply by 0.975 a second time. [Versioned conversion implementation](https://github.com/colour-science/colour/blob/v0.4.6/colour/notation/munsell.py)
4. Four estimated black-tinted centroids (IDs **24, 65, 114, 157**) have Munsell value below 1, outside that interpolator's normal domain. For these only, extrapolate xy linearly in luminance from values 1 and 2 at the specified hue/chroma; calculate target luminance from the original value. Each is flagged in the output. This is an additional project approximation, not an NBS conversion rule.
5. Convert xyY/C to XYZ/C, adapt C to D65 with Bradford, then convert XYZ/D65 to CIELAB/D65. Use CIE 1931 2-degree whites: C xy `(0.31006, 0.31616)`, D65 xy `(0.3127, 0.3290)`.
6. Retain Lab coordinates to ten decimal places. Do **not** convert references to rounded/clipped sRGB swatches for classification: some references lie outside the display gamut.

The JSON includes the method version, conversion summary and SHA-256 of the source CSV encoded as UTF-8 with normalized LF line endings. Python and the conversion packages are generation tools only. The app embeds the table in the executable and loads it once.

## Runtime matching and label stability

The Rust core interprets the sampled 8-bit RGB as **SDR sRGB**, decodes its transfer function and converts through XYZ/D65 to CIELAB/D65. It compares the result with every usable reference using CIEDE2000 with `kL = kC = kH = 1`. Exact distance ties choose the lower source ID.

One application rule keeps grays and nearly neutral samples achromatic: if a sample is within **1.5 CIEDE2000 units of the neutral axis at its own L*** (`[L*, 0, 0]`), compare it only against the five source neutral references, IDs 263–267. Their original coordinates, including the tiny source chroma for white/light gray/medium gray, are retained. Without this restriction, sparse centroid spacing can assign almost-black samples such as `[1, 0, 0]` to a greenish-black reference. The threshold covers the one-level channel perturbations tested across all 256 grays (maximum distance about 1.2054). It is a documented application policy, not an NBS boundary or a universal perceptibility guarantee. Tests cover that full ramp and noise set.

The response includes the winning ID, exact source English designation, distance, method version, and runner-up ID/designation/distance. Distances and their gap are **not confidence percentages**. Settings explicitly identify naming as approximate. If the source designation has no separate qualifier, the UI shows “Approximate name” instead of inventing an intensity term.

The live main readout and capture tooltip debounce an ambiguous label change only when the new RGB is within 12 levels per channel of the accepted label's sample and the winner/runner-up distance gap is below 1. The candidate must persist for 240 ms. Alternation resets that interval; large jumps, clearer matches and sampling resumed after more than 400 ms update immediately. These values are UX choices, not standardized tolerances or proof of an indistinguishable color difference.

The swatch and HEX/RGB always use the latest raw sample. Copying uses that exact value. The capture command samples and classifies again in Rust without debounce, then saves/copies that pixel. A completed capture resets the display filter. The tooltip measures its height so longer localized names remain away from the sampled pixel near the bottom edge.

## Persistence compatibility

History still stores only the original HEX, entry ID and timestamp. Existing WPF imports and Rust history are preserved; descriptions are recomputed when loaded. A naming update can change the words attached to an old saved color, but does not change its saved RGB/HEX. No migration or history rewrite is required.

## Validation

- Rust matches all **34 Sharma–Wu–Dalal supplementary CIEDE2000 pairs**, in both directions, within `0.00005`, including zero-chroma and hue-wrap cases. These are independent numerical tests, not a claim of CIE certification. [Author's test data and implementation notes](https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/)
- RGB-to-Lab fixtures cover black, white and the sRGB primaries using an independently calculated derived sRGB matrix. Reference integrity checks cover unique IDs, the single exclusion, finite coordinates and self-matching.
- Regression samples cover brown, pink, pale warm colors, blue and the screenshot palette. Generated browser examples are checked against Rust IDs, labels and distances. All 256 exact RGB grays and one-level perturbations in each channel stay neutral.
- Browser tests exercise boundary oscillation and settling, both languages, immediate exact swatch/value/copy while a label is held, long capture names, existing capture/history/settings/error/keyboard flows.
- The native Windows smoke test verifies a known GDI pixel, its ISCC–NBS category/qualifier, actual clipboard value, capture cancellation and persistence. README screenshots are regenerated from the real backend with an isolated example palette.

Run the normal checks in [DEVELOPMENT.md](DEVELOPMENT.md). To regenerate data, use Python 3.12 in an isolated environment:

```sh
python -m venv .venv/color-data
# Windows:
.venv/color-data/Scripts/python -m pip install -r scripts/requirements-color-data.txt
.venv/color-data/Scripts/python scripts/generate-color-data.py
.venv/color-data/Scripts/python scripts/generate-color-data.py --check
```

On other systems use `.venv/color-data/bin/python`. `--check` verifies the generated references and fixtures without writing them. It does not verify a transcription against the original scan, replace human translation review, or validate HDR/monitor-profile behavior. Future changes to the reference set, conversion or matching policy should introduce a new method version and update the regression examples. The full notices are in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
