# Color naming: standards and implementation choices

Research date: 2026-10-15. Scope: choosing documented color nomenclature before changing the classifier. No classifier implementation is included in this research.

Implementation follow-up: the selected nearest-centroid method, conversion decisions, verified data and exclusions are documented in [COLOR-NAMING.md](COLOR-NAMING.md). This note retains the evidence and alternatives considered before implementation.

## Separate naming from colorimetry

**ISO/CIE colorimetry and a color naming dictionary solve different problems.** ISO/CIE 11664-4:2019 specifies CIELAB coordinates and color differences; ISO lists it as current, confirmed in 2024. Its scope includes appropriately normalized self-luminous displays when they simulate reflecting or transmitting objects. It does not provide an Italian/English dictionary of color names. [ISO/CIE 11664-4:2019](https://www.iso.org/standard/74166.html)

ISO/CIE 11664-6:2022 defines the CIEDE2000 color-difference formula and supersedes the 2014 edition. It provides a numerical comparison of colors, rather than deciding which linguistic category contains them. Choosing the nearest named sample with this formula would still be an application policy, not a naming rule supplied by ISO. [CIE: ISO/CIE 11664-6:2022](https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula-1)

## ISCC–NBS: a documented naming system

The historical US ISCC–NBS system is directly relevant to readable descriptions. Its revised naming method was published as NBS Circular 553 in 1955. It defines color-name regions through Munsell hue, value and chroma, with 31 hue-range charts. It should be described as a historical US nomenclature system, without implying that it is a current universal ISO naming standard. [NBS Circular 553](https://nvlpubs.nist.gov/nistpubs/Legacy/circ/nbscircular553.pdf)

The later *Universal Color Language* distinguishes increasing levels of description: 13 broad categories, 29 categories with intermediate hues, and 267 names including lightness/saturation modifiers. Its worked example progresses from brown to yellowish brown to light yellowish brown. This supports an interface with a simple family and a more detailed description, provided both come from a documented mapping. [Kelly and Judd, NBS SP 440, table 1, p. A-7](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nbsspecialpublication440.pdf)

### Original regions versus nearest centroid

The 267 designations refer to regions, not just 267 RGB points. Kelly's 1958 paper tabulates central Munsell notations for these regions. It explicitly treats matching a central sample as a faster, less exact method, with borderline cases requiring the original naming charts. Therefore, nearest-centroid matching in CIELAB/CIEDE2000 or Oklab must be labelled an **ISCC–NBS-based approximation**, rather than an exact implementation of the original classification. The paper also marks estimated peripheral centroids and uncertainties. [Kelly, 1958, sections 2–5](https://nvlpubs.nist.gov/nistpubs/jres/61/jresv61n5p427_A1b.pdf)

For the app, implementing the documented region boundaries would be the more faithful option **if** we can verify the complete boundaries and a defensible sRGB-to-Munsell conversion. Otherwise, a reproducible centroid approximation remains a practical fallback. This is an implementation recommendation inferred from the distinction above, not a claim that NBS standardized an sRGB classifier.

### Digital data and provenance

The authoritative online material located during this research consists of scanned publications with Munsell definitions and central notations. **No authoritative NIST sRGB/HEX table was located in this search.** This does not establish that no such table exists. A third-party table must not silently become the source of supposedly official RGB values. Before bundling one, verify its author, conversion method, reference illuminant/white, gamut handling and redistribution terms.

A project-generated table should retain the original designation number, English designation and Munsell notation, plus source edition and table/page references. Derived coordinates should record conversion inputs and version. Keep rounded preview RGB separate from reference coordinates used for classification. These are project provenance requirements, rather than additional rules claimed to come from the historical system.

NIST distinguishes employee-authored works from third-party contributions and Standard Reference Data. Its policy permits worldwide reproduction/derivatives of applicable NIST technical publications with attribution; modifications should be identified, and third-party rights still need checking. It is therefore inappropriate to assume every downloaded palette is public domain merely because it mentions NBS. Preserve the applicable notice and cite the actual source; do not copy an unrelated site's conversion without checking its terms. [NIST copyright, data and technical-publication policy](https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications)

## Other standards and reference catalogs

| Reference | What it specifies | Relevance to this app |
| --- | --- | --- |
| IEC 61966-2-1:1999, sRGB | RGB encoding and communication under defined reference conditions | A documented input color space, rather than a naming dictionary. [IEC publication](https://webstore.iec.ch/en/publication/6169) |
| W3C CSS named colors | English keywords with exact sRGB values | Useful for web interoperability. A nearest-keyword classifier would be our matching policy. The specification explicitly notes uneven coverage and inconsistent names, including `darkgray` being lighter than `gray`. [CSS Color 4, named colors](https://www.w3.org/TR/2026/CRD-css-color-4-20261009/#named-colors) |
| NCS | Perceptual color notation for surface colors | The supplier offers an integration licence, including digital workflows. Investigate the applicable terms before choosing it for a distributed app. [NCS Inside](https://ncscolour.com/pages/ncs-inside) |
| RAL | Industrial color collections and references | RAL provides licensing for software and mobile applications; its digital libraries include RGB/Lab approximations of physical samples. [RAL licensing](https://www.ral-farben.de/lizenzierung), [digital library](https://shop.ral-farben.de/de/ral-digitale-farbbibliothek-set.html) |
| Pantone | Proprietary color libraries and reference systems | Pantone offers software/web licensing for its libraries, data and numbering system. [Pantone software licensing](https://www.pantone.com/license/software-and-web) |

Status matters: [CSS Color 3](https://www.w3.org/TR/css-color-3/) is a W3C Recommendation dated 18 January 2022. The CSS Color 4 version reviewed here is a **Candidate Recommendation Draft dated 9 October 2026**, not a final Recommendation. Color 4 also specifies Oklab/OKLCH and documents color-difference calculations. Oklab supplies coordinates for comparisons, not a linguistic naming dictionary. [CSS Color 4, Oklab](https://www.w3.org/TR/2026/CRD-css-color-4-20261009/#ok-lab), [color differences](https://www.w3.org/TR/2026/CRD-css-color-4-20261009/#color-difference)

**Product recommendation:** prioritize ISCC–NBS for everyday descriptive names, with a versioned reference vocabulary and documented conversions. CSS names can be a separate compatibility feature if requested. NCS, RAL and Pantone should be considered when matching those specific catalogs becomes a product requirement. This preference is our assessment of the app's accessibility purpose, not a ranking prescribed by a standards body.

## Application boundaries

The following are proposed product requirements, not assertions of standards compliance:

- Treat English ISCC–NBS labels and designation numbers as the reference vocabulary. Italian labels would be **project translations** unless an authoritative translation is verified; retain the English reference and ID for traceability.
- Preserve the sampled RGB/HEX independently of its descriptive name. A name describes a region and cannot replace the numerical sample.
- Explicitly document the app's input assumption, initially SDR sRGB. Naming should not imply measurement of a real object's reflectance or the user's exact perceived appearance.
- Establish the screen-capture/color-management path before claiming display accuracy. HDR, monitor profiles and viewing conditions require separate investigation; an 8-bit sample alone is not proof of a calibrated physical color measurement.
- Test conversions against independent numerical fixtures; test region boundaries separately from human readability. A numerical distance improvement does not establish a percentage improvement in naming accuracy.
- Do not recalibrate the reference vocabulary to a particular color-vision deficiency without a separate product requirement: the accessibility goal is to communicate a conventional color description to the user.

## Decision checkpoint

The implementation selects the ISCC–NBS reference vocabulary and separately specifies CIELAB/CIEDE2000 matching. It uses a versioned nearest-centroid approximation, with the source table transcribed and conversion choices recorded. Exact reconstruction of the original boundaries remains outside this version. See [the implemented method and validation](COLOR-NAMING.md) for the final decisions.
