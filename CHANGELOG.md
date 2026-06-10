# Changelog

## 0.2.0

### Breaking Changes

- **Node.js 22.18+ required.** The minimum supported Node version is now `>=22.18.0` (previously `>=16`). This aligns with the tsdown build toolchain and its supported Node versions.

### Changed

- Replaced Parcel with [tsdown](https://github.com/rolldown/tsdown) for bundling.
- Package is now published as native ESM (`"type": "module"`).
- Added an `exports` field in `package.json` for modern module resolution.
- Type declarations moved from `dist/types.d.ts` to `dist/module.d.ts`.
- Source maps are now emitted for both JS (`dist/module.js.map`) and type declarations (`dist/module.d.ts.map`).
