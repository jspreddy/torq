# Changelog

## 0.2.1

### Added

- CommonJS build output (`dist/module.cjs`) alongside the existing ESM bundle.
- `main` and `exports.require` entries in `package.json` for `require()` consumers.
- CJS type declarations at `dist/module.d.cts`.

## 0.2.0

### Breaking Changes

- **Node.js 18+ required at runtime.** The minimum supported Node version is now `>=18.0.0` (previously `>=16`).
- Package is now ESM-only (`"type": "module"`).

### Changed

- Replaced Parcel with [tsdown](https://github.com/rolldown/tsdown) for bundling.
- Development and CI use Node.js 22.18+ (required by the tsdown build toolchain). The published bundle targets Node.js 18 via `target: 'node18'`.
- Package is now published as native ESM (`"type": "module"`).
- Added an `exports` field in `package.json` for modern module resolution.
- Type declarations moved from `dist/types.d.ts` to `dist/module.d.ts`.
- Source maps are now emitted for both JS (`dist/module.js.map`) and type declarations (`dist/module.d.ts.map`).
