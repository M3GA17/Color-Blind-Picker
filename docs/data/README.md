# ISCC–NBS source data

`iscc-nbs-centroids-source.csv` is a project transcription of table 1 in:

Kenneth L. Kelly (1958), *Central Notations for the Revised ISCC–NBS Color-Name Blocks*, Journal of Research of the National Bureau of Standards, volume 61, number 5, Research Paper 2911, pp. 427–431. [Official NIST PDF](https://nvlpubs.nist.gov/nistpubs/jres/61/jresv61n5p427_A1b.pdf).

Republished courtesy of the National Institute of Standards and Technology.

This is a transcription of the **1958 centroids for the revised 1955 naming blocks**, rather than the 1941 central notations of the original system. The source itself distinguishes the two in its introduction. These centroids are representative points, not the boundaries defining the ISCC–NBS regions. Section 5 explicitly describes matching a central sample as less exact than using the original boundary charts.

## Contents and verification

The CSV contains all 267 source designation numbers, original English labels, Munsell central notations and printed source-page numbers:

| IDs | Printed page | PDF page (one based) |
| --- | --- | --- |
| 1–70 | 428 | 2 |
| 71–190 | 429 | 3 |
| 191–267 | 430 | 4 |

The scan was downloaded on 2026-10-15, extracted locally and visually checked against rendered table pages. Sequence validation confirms exactly 267 rows, with each integer ID from 1 through 267 present once. Exactly 120 entries retain an asterisk, agreeing with the count of estimated peripheral centroids reported in section 4. No RGB or HEX coordinates have been copied from a third-party palette.

Downloaded PDF SHA-256:

```text
55cab012e1c368831776d7e0243514e773b2677425af48a0e09504027209c1a5
```

Transcription changes made by this project on 2026-10-15: normalized spacing, joined line-wrapped labels, removed typography/italics, corrected OCR errors by referring to the scan, and represented minus signs as ASCII `-`. Original uncertain numeric notations and the exceptional printed label at ID 81 are preserved. The PDF itself is not bundled in the repository.

## Reading the notation

- An asterisk `*` identifies one of the 120 peripheral centroids estimated graphically in the source. It is source metadata, not part of the Munsell notation.
- A trailing `+` or `-` indicates uncertainty in the next decimal place, as described in source section 4. This includes hue uncertainty at IDs 11 (`5-R`) and 34 (`9.5+R`), as well as value/chroma uncertainty. A conversion may use the displayed numerical center only if it explicitly records that approximation.
- Neutral notations such as `N 3.5/` are retained as printed. White and two lighter gray centroids use low, nonzero chroma in this table; they must not silently be replaced by ideal RGB gray.
- ID 81 is literally **dark grayish yellow brown** in this table; this transcription does not silently change the source label to “yellowish brown.” A UI may use a documented editorial display label separately.

### Two ambiguous printed entries

| ID | Source transcription | Handling required |
| --- | --- | --- |
| 198 | `7.PB 7.8+/6.1+*` | The scan prints `7.` followed by a gap and `PB`. If used numerically, interpret the printed `7.` literally as `7.0PB` and document the normalization. Do not silently invent a missing digit, such as `7.5PB`. |
| 222 | `6.0P 6.5/7/2` | The scan prints a slash between the final `7` and `2`. It appears likely to be a typographic defect, but `7.2` has not been independently verified from another authoritative source. Retain the category in the source data; exclude this reference point from numeric generation until an explicit, evidenced resolution is recorded. |

Search-result OCR sometimes supplies different numbers for these and other rows. It is not an independent source. For example, the scan at ID 246 reads `4.0RP 7.9+/11+*`, and at ID 236 reads `1.0RP 4+/19+*`; those literal values are retained. NBS SP 440 was also checked locally, but did not provide a usable independent verification of the two ambiguous centroids in this search.

## Illuminant and derived coordinates

The 1958 centroid table specifies **Munsell renotations**, not sRGB. NBS describes the ideal Munsell renotation system in relation to **illuminant C**, including its luminous-reflectance/value relation. See *Colorimetry*, NBS Circular 478, printed p. 39, and its discussion of the renotation charts. [Official NIST PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/circ/nbscircular478.pdf).

Consequently, a generated sRGB/D65 representation requires a documented conversion and white-point treatment; it is a derived project result, not an official NBS RGB value. Record the conversion implementation/version, handling of `*`/`+`/`-`, excluded entries, chromatic adaptation and any gamut mapping in the generator documentation. Classification should use the reference colorimetric values rather than a clipped or rounded preview swatch. Italian labels would be project translations of the original English nomenclature, with the original designation IDs retained.

## Generated table used by the app

The checked-in runtime artifact is `src-tauri/data/iscc-nbs-v1.json`, generated by `scripts/generate-color-data.py`. It preserves source notations alongside central estimates and derived CIELAB/D65 coordinates, plus the method version and source-CSV SHA-256 (UTF-8, LF line endings). The source CSV above remains unchanged by generation.

The runtime has **266** numerical references: ID 198 is explicitly normalized to `7.0PB`, neutral notations are normalized for the converter, and ID 222 is excluded. Original `+`/`-`/`*` metadata is retained. Four low-value references (24, 65, 114, 157) require flagged extrapolation below Munsell value 1. Conversion uses Colour 0.4.6 with illuminant C, Bradford adaptation to D65 and CIELAB/D65; reference values are never clipped to sRGB. [Full generation and matching decisions](../COLOR-NAMING.md).

Colour's BSD notice and the Paul Centore toolbox attribution are retained in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md). The application bundles that notice, this source note and the method guide with the Windows installer.

## NIST reuse and attribution

NIST's policy distinguishes employee-authored works and technical publications from third-party works and separately protected Standard Reference Data. The applicable technical-publication policy grants worldwide reproduction and derivative-work rights for NIST-authored publications with attribution; third-party contributions require separate attention. [NIST copyright, fair-use and licensing policy](https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications).

The source attribution and modification notice above accompany this transcription. NIST is the source of the historical table; the transcription, derived coordinates and translations are project work. Their publication does not imply NIST endorsement, certification, or a warranty of accuracy. Preserve this attribution and the source/derivation distinction when redistributing the data.
