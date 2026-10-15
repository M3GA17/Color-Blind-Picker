//! SDR sRGB (D65, CIE 1931 2°) to CIELAB and CIEDE2000, kL = kC = kH = 1.
//! Formula references and independent test data: docs/COLOR-NAMING.md.

pub type Lab = [f64; 3];

pub fn srgb_to_lab(rgb: [u8; 3]) -> Lab {
    let [r, g, b] = rgb.map(|channel| {
        let encoded = f64::from(channel) / 255.0;
        if encoded <= 0.04045 {
            encoded / 12.92
        } else {
            ((encoded + 0.055) / 1.055).powf(2.4)
        }
    });
    // Matrix derived from the sRGB primaries and D65 xy = (0.3127, 0.3290).
    let xyz = [
        0.4123907992659595 * r + 0.357584339383878 * g + 0.1804807884018343 * b,
        0.2126390058715104 * r + 0.715168678767756 * g + 0.0721923153607337 * b,
        0.0193308187155918 * r + 0.119194779794626 * g + 0.9505321522496607 * b,
    ];
    let white = [0.9504559270516716, 1.0, 1.0890577507598784];
    let f = std::array::from_fn::<_, 3, _>(|i| {
        let ratio = xyz[i] / white[i];
        if ratio > 216.0 / 24389.0 {
            ratio.cbrt()
        } else {
            (24389.0 / 27.0 * ratio + 16.0) / 116.0
        }
    });
    [
        116.0 * f[1] - 16.0,
        500.0 * (f[0] - f[1]),
        200.0 * (f[1] - f[2]),
    ]
}

pub fn delta_e_2000([l1, a1, b1]: Lab, [l2, a2, b2]: Lab) -> f64 {
    let c1 = a1.hypot(b1);
    let c2 = a2.hypot(b2);
    let c_mean = (c1 + c2) / 2.0;
    let c7 = c_mean.powi(7);
    let g = 0.5 * (1.0 - (c7 / (c7 + 25_f64.powi(7))).sqrt());
    let a1_prime = (1.0 + g) * a1;
    let a2_prime = (1.0 + g) * a2;
    let c1_prime = a1_prime.hypot(b1);
    let c2_prime = a2_prime.hypot(b2);
    let hue = |a: f64, b: f64| {
        if a == 0.0 && b == 0.0 {
            0.0
        } else {
            b.atan2(a).to_degrees().rem_euclid(360.0)
        }
    };
    let h1 = hue(a1_prime, b1);
    let h2 = hue(a2_prime, b2);
    let chroma_product = c1_prime * c2_prime;
    let hue_difference = h2 - h1;
    let delta_h = if chroma_product == 0.0 {
        0.0
    } else if hue_difference.abs() <= 180.0 {
        hue_difference
    } else if hue_difference > 180.0 {
        hue_difference - 360.0
    } else {
        hue_difference + 360.0
    };
    let delta_l = l2 - l1;
    let delta_c = c2_prime - c1_prime;
    let delta_h_term = 2.0 * chroma_product.sqrt() * (delta_h / 2.0).to_radians().sin();
    let l_mean = (l1 + l2) / 2.0;
    let c_mean_prime = (c1_prime + c2_prime) / 2.0;
    let h_mean = if chroma_product == 0.0 {
        h1 + h2
    } else if hue_difference.abs() <= 180.0 {
        (h1 + h2) / 2.0
    } else if h1 + h2 < 360.0 {
        (h1 + h2 + 360.0) / 2.0
    } else {
        (h1 + h2 - 360.0) / 2.0
    };
    let cos = |degrees: f64| degrees.to_radians().cos();
    let t =
        1.0 - 0.17 * cos(h_mean - 30.0) + 0.24 * cos(2.0 * h_mean) + 0.32 * cos(3.0 * h_mean + 6.0)
            - 0.20 * cos(4.0 * h_mean - 63.0);
    let l_offset_squared = (l_mean - 50.0).powi(2);
    let sl = 1.0 + 0.015 * l_offset_squared / (20.0 + l_offset_squared).sqrt();
    let sc = 1.0 + 0.045 * c_mean_prime;
    let sh = 1.0 + 0.015 * c_mean_prime * t;
    let c7_prime = c_mean_prime.powi(7);
    let rc = 2.0 * (c7_prime / (c7_prime + 25_f64.powi(7))).sqrt();
    let theta = 30.0 * (-((h_mean - 275.0) / 25.0).powi(2)).exp();
    let rt = -rc * (2.0 * theta).to_radians().sin();
    let dl = delta_l / sl;
    let dc = delta_c / sc;
    let dh = delta_h_term / sh;
    (dl * dl + dc * dc + dh * dh + rt * dc * dh).max(0.0).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn srgb_primaries_match_independent_d65_lab_fixtures() {
        // Colour 0.4.6 with the derived sRGB transformation matrix.
        let cases = [
            ([0, 0, 0], [0.0, 0.0, 0.0]),
            ([255, 255, 255], [100.0, 0.0, 0.0]),
            ([255, 0, 0], [53.23711560, 80.09011352, 67.20326351]),
            ([0, 255, 0], [87.73551911, -86.18159689, 83.18662027]),
            ([0, 0, 255], [32.30087290, 79.19527031, -107.85546554]),
        ];
        for (rgb, expected) in cases {
            for (actual, target) in srgb_to_lab(rgb).into_iter().zip(expected) {
                assert!(
                    (actual - target).abs() < 0.00001,
                    "{rgb:?}: {actual} vs {target}"
                );
            }
        }
    }

    #[test]
    fn matches_all_sharma_wu_dalal_reference_pairs_in_both_directions() {
        let data = include_str!("../../tests/data/ciede2000-sharma.txt");
        let mut count = 0;
        for line in data.lines().filter(|line| !line.trim().is_empty()) {
            let v: Vec<f64> = line
                .split_whitespace()
                .map(|n| n.parse().unwrap())
                .collect();
            assert_eq!(v.len(), 7);
            let first = [v[0], v[1], v[2]];
            let second = [v[3], v[4], v[5]];
            assert!(
                (delta_e_2000(first, second) - v[6]).abs() < 0.00005,
                "pair {}",
                count + 1
            );
            assert!(
                (delta_e_2000(second, first) - v[6]).abs() < 0.00005,
                "reverse pair {}",
                count + 1
            );
            assert_eq!(delta_e_2000(first, first), 0.0);
            count += 1;
        }
        assert_eq!(count, 34);
    }
}
