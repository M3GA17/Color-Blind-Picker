# Color naming sources and notices

## NBS / NIST source publication

Kenneth L. Kelly (1958), *Central Notations for the Revised ISCC–NBS Color-Name Blocks*, Journal of Research of the National Bureau of Standards, volume 61, number 5, Research Paper 2911, pp. 427–431.

Source: https://nvlpubs.nist.gov/nistpubs/jres/61/jresv61n5p427_A1b.pdf

Republished courtesy of the National Institute of Standards and Technology.

This project transcribed the source table, normalized formatting, generated derived CIELAB coordinates and supplied Italian translations. One ambiguous reference is excluded from numerical matching; four low-value references use documented extrapolation. The resulting nearest-centroid classifier is a project approximation. These changes are not an NIST-endorsed or certified implementation. Source uncertainties and modifications are documented in the repository's `docs/data/README.md` and `docs/COLOR-NAMING.md`.

NIST publication policy: https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications

## Colour 0.4.6 generation tools

Reference coordinates were generated with Colour 0.4.6. Colour/Python is not required or bundled as runtime code. Its Munsell implementation includes portions of The Munsell and Kubelka–Munk Toolbox, copyright Paul Centore, 2010–2018, distributed by Colour under BSD-3-Clause with the author's explicit permission.

Sources: https://github.com/colour-science/colour/tree/v0.4.6 and https://github.com/colour-science/colour/blob/v0.4.6/THIRD_PARTY

The following notice is retained for the conversion tooling and derived reference distribution:

Copyright 2013 Colour Developers

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Numerical verification data

The development test fixture `src-tauri/tests/data/ciede2000-sharma.txt` is the supplementary numerical test data supplied by G. Sharma, W. Wu and E. N. Dalal for *The CIEDE2000 Color-Difference Formula: Implementation Notes, Supplementary Test Data, and Mathematical Observations*, Color Research and Application 30(1), 21–30 (2005).

Author's publication and data: https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/

Only the numerical test pairs are included. The author's MATLAB/Excel programs are not copied or bundled; the Rust implementation is independently written. These tests do not imply official CIE verification or endorsement.
