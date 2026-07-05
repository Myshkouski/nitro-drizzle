## v0.2.7

[compare changes](https://github.com/Myshkouski/nitro-drizzle/compare/v0.2.6...v0.2.7)

### 💅 Refactors

- **module:** Return plugin IDs instead of plugin names from enablePlugins ([52f1ea5](https://github.com/Myshkouski/nitro-drizzle/commit/52f1ea5))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))

## v0.2.6

[compare changes](https://github.com/Myshkouski/nitro-drizzle/compare/v0.2.5...v0.2.6)

### 🩹 Fixes

- **module:** Remove redundant module type augmentation ([4b40dd5](https://github.com/Myshkouski/nitro-drizzle/commit/4b40dd5))
- **module:** Ensure plugin names include nitro-drizzle/plugins prefix ([8d1c39d](https://github.com/Myshkouski/nitro-drizzle/commit/8d1c39d))

### 💅 Refactors

- **module:** Add generic constraint to virtual module types ([24e1622](https://github.com/Myshkouski/nitro-drizzle/commit/24e1622))
- **module:** Integrate plugin enablement and clean up type system ([fd0717a](https://github.com/Myshkouski/nitro-drizzle/commit/fd0717a))
- **module:** Remove PluginName type constraint and allow direct plugin IDs ([e365a83](https://github.com/Myshkouski/nitro-drizzle/commit/e365a83))
- **virtual:** Pre-compute merged schema variables in runtime module ([ccbf4ab](https://github.com/Myshkouski/nitro-drizzle/commit/ccbf4ab))

### 🏡 Chore

- **config:** Add CHANGELOG.md to oxfmt ignore patterns ([d779d87](https://github.com/Myshkouski/nitro-drizzle/commit/d779d87))
- **context:** Remove unused genString import ([5f1c422](https://github.com/Myshkouski/nitro-drizzle/commit/5f1c422))

### 🤖 CI

- **github:** Add fmt:check step to CI workflow ([cad4bb8](https://github.com/Myshkouski/nitro-drizzle/commit/cad4bb8))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))

## v0.2.5

[compare changes](https://github.com/Myshkouski/nitro-drizzle/compare/v0.2.4...v0.2.5)

### 🚀 Enhancements

- **module:** Register module type augmentations ([39fad9b](https://github.com/Myshkouski/nitro-drizzle/commit/39fad9b))

### 🩹 Fixes

- **context:** Handle empty datasources in template generation ([9a64396](https://github.com/Myshkouski/nitro-drizzle/commit/9a64396))

### 🎨 Styles

- **module:** Normalize formatting in type generation utilities ([e2ec11e](https://github.com/Myshkouski/nitro-drizzle/commit/e2ec11e))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))

## v0.2.4

[compare changes](https://github.com/Myshkouski/nitro-drizzle/compare/v0.2.3...v0.2.4)

## v0.2.3

[compare changes](https://github.com/Myshkouski/nitro-drizzle/compare/v0.2.1...v0.2.3)

### 🩹 Fixes

- **types:** Resolve relative paths from tsconfig directory ([6f693b4](https://github.com/Myshkouski/nitro-drizzle/commit/6f693b4))

### 🏡 Chore

- **release:** V0.2.2 ([d576b4a](https://github.com/Myshkouski/nitro-drizzle/commit/d576b4a))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))

## v0.2.2

[compare changes](https://github.com/Myshkouski/nitro-drizzle/compare/v0.2.1...v0.2.2)

### 🩹 Fixes

- **types:** Resolve relative paths from tsconfig directory ([6f693b4](https://github.com/Myshkouski/nitro-drizzle/commit/6f693b4))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))

## v0.2.1

[compare changes](https://github.com/Myshkouski/nitro-drizzle/compare/v0.2.0...v0.2.1)

### 🏡 Chore

- **release:** V0.2.0 ([63f80ab](https://github.com/Myshkouski/nitro-drizzle/commit/63f80ab))
- **release:** Add --release flag to changelogen script ([fd38f0a](https://github.com/Myshkouski/nitro-drizzle/commit/fd38f0a))

### 🤖 CI

- **actions:** Add publish job for npm with OIDC provenance ([8f20b7c](https://github.com/Myshkouski/nitro-drizzle/commit/8f20b7c))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))

## v0.2.0


### 🚀 Enhancements

- Initial implementation of nitro-drizzle ([8b9f6fe](https://github.com/Myshkouski/nitro-drizzle/commit/8b9f6fe))
- ⚠️  Refactor context and migration systems, add blog-api fixture ([efe570d](https://github.com/Myshkouski/nitro-drizzle/commit/efe570d))

### 📖 Documentation

- Add changelog for v0.1.0 release ([94a092a](https://github.com/Myshkouski/nitro-drizzle/commit/94a092a))
- Add changelog entry for v0.1.0 release ([5787cf3](https://github.com/Myshkouski/nitro-drizzle/commit/5787cf3))
- **changelog:** Update changelog with recent entries ([cc6c6a2](https://github.com/Myshkouski/nitro-drizzle/commit/cc6c6a2))

### 🏡 Chore

- Initial commit ([76a2d80](https://github.com/Myshkouski/nitro-drizzle/commit/76a2d80))
- **playground:** Remove prepare script ([48ce895](https://github.com/Myshkouski/nitro-drizzle/commit/48ce895))

### ✅ Tests

- Update usePrimaryColumns import to public API path ([2b4e391](https://github.com/Myshkouski/nitro-drizzle/commit/2b4e391))

### 🤖 CI

- **actions:** Update github actions to latest major versions ([d478d2f](https://github.com/Myshkouski/nitro-drizzle/commit/d478d2f))
- **actions:** Remove explicit pnpm version pin ([997a110](https://github.com/Myshkouski/nitro-drizzle/commit/997a110))
- **actions:** Add build step to CI workflow ([f8ee2ba](https://github.com/Myshkouski/nitro-drizzle/commit/f8ee2ba))

#### ⚠️ Breaking Changes

- ⚠️  Refactor context and migration systems, add blog-api fixture ([efe570d](https://github.com/Myshkouski/nitro-drizzle/commit/efe570d))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))

## ...main

### 🚀 Enhancements

- Initial implementation of nitro-drizzle ([8b9f6fe](https://github.com/Myshkouski/nitro-drizzle/commit/8b9f6fe))

### 📖 Documentation

- Add changelog for v0.1.0 release ([94a092a](https://github.com/Myshkouski/nitro-drizzle/commit/94a092a))
- Add changelog entry for v0.1.0 release ([5787cf3](https://github.com/Myshkouski/nitro-drizzle/commit/5787cf3))

### 🏡 Chore

- Initial commit ([76a2d80](https://github.com/Myshkouski/nitro-drizzle/commit/76a2d80))

### 🤖 CI

- **actions:** Update github actions to latest major versions ([d478d2f](https://github.com/Myshkouski/nitro-drizzle/commit/d478d2f))

### ❤️ Contributors

- Alexei Myshkouski ([@Myshkouski](https://github.com/Myshkouski))
