# Manual Windows releases

Releases are built on a Windows development machine and uploaded with GitHub CLI. This repository has no build/release GitHub Actions workflow; publishing a release does not require one.

## Prepare and verify

1. Start from the intended `master` commit with no unrelated changes. Check for an existing release/tag before choosing a version; never replace published version assets or move its tag.
2. Align versions in `package.json`, the root entries of `package-lock.json`, `src-tauri/Cargo.toml`, its package entry in `src-tauri/Cargo.lock`, and `src-tauri/tauri.conf.json`.
3. Write notes in `docs/releases/vX.Y.Z.md`, update the README download links and installer filename in the development guide.
4. Run the frontend build/tests, Rust tests, formatting and Clippy listed in [DEVELOPMENT.md](DEVELOPMENT.md). Build the debug desktop app and run the native Windows smoke test.
5. Run `npm run bundle` to generate the optimized executable and NSIS installer locally. Check the executable's product/file version.

## Package locally

Use an ignored staging directory under `src-tauri/target/`. Keep the installer, portable folder, ZIP and checksums separate from source control.

- Copy the NSIS installer to `Color-Blind-Picker_X.Y.Z_windows-x64-setup.exe`.
- Create a portable folder with `color-blind-picker.exe`, `THIRD_PARTY_NOTICES.md`, `COLOR_DATA_SOURCES.md`, `COLOR_NAMING_METHOD.md`, and a short README explaining extraction, WebView2 and WPF history import. The notice files are copied beside the executable by the Tauri build.
- ZIP the folder contents as `Color-Blind-Picker_X.Y.Z_windows-x64_portable.zip`. Check the archive entries and verify that the enclosed executable matches the built executable byte for byte.
- Create `SHA256SUMS.txt` with a lowercase SHA-256 hash, two spaces, and the final asset filename on each line for the installer and ZIP. In PowerShell use `Get-FileHash -Algorithm SHA256`.

The portable package requires an existing WebView2 installation. The NSIS installer uses Tauri's WebView2 prerequisite handling. Keep source/third-party notices in both distributions.

## Publish without Actions

Check both repository workflow files and GitHub's registered workflows: GitHub may have a dynamic dependency-submission workflow even when no YAML exists in the repository. To guarantee no Actions execution during publication, temporarily disable Actions in the repository settings before the pushes/release, recording the prior configuration, and restore that configuration afterwards. This changes the Actions execution setting, not the dependency/scanning security features. Do not dispatch a workflow.

Commit the prepared source changes, push `master`, create an annotated `vX.Y.Z` tag at that exact commit, then push the tag. Create a **draft** release with the verified tag, title, notes file and all three assets. For example:

```sh
git tag -a vX.Y.Z -m "Color Blind Picker X.Y.Z"
git push origin master
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag --draft --title "Color Blind Picker X.Y.Z" --notes-file docs/releases/vX.Y.Z.md <installer> <portable-zip> <checksums>
```

Verify the draft's asset names, sizes, tag target and notes; download the assets to a different local directory and compare their hashes with the uploaded checksum file and the local build. Once verified, publish and mark the release latest:

```sh
gh release edit vX.Y.Z --draft=false --latest --verify-tag
```

Finally verify the public release, tag/commit, latest-release pointer and assets. Confirm no Actions runs were created for the release commit, restore the prior Actions setting, and confirm a clean working tree. GitHub's generated source archives are supplied automatically from the tag; the Windows binaries above are uploaded manually.
