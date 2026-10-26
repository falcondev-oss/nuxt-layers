# nuxt-layers

Nuxt layers published to npm. `base/` is the only layer (`@falcondev-oss/nuxt-layers-base`); `base/.playground` is a Nuxt app that extends it for manual and browser checks.

## Layers stay app-agnostic

Every layer serves any consuming app. Write code, copy, playground data, commit messages, PR text and screenshots in generic terms: expose a prop, slot or option where an app needs something specific, and use neutral German demo data (`Projekte`, `Tom Weinhold`). When a request comes from a consuming app, build the general capability behind it and name it by what it does.

## Commit gate

`pnpm lint` and `pnpm type-check` from the repo root pass clean; `pnpm lint:fix` applies ESLint and Prettier fixes. Run these scripts rather than `eslint` or `prettier` directly: they carry the cache flags and the root ignore files. `pnpm install` sets up the husky hooks: pre-commit fixes staged files and type-checks, pre-push runs lint and type-check, commit-msg enforces conventional commits.

`base/LLM.md` is the usage guide consuming apps' agents read. Update it in the same commit as any added, renamed or removed composable, component or prop.

## Playground

Show each feature on its own page, `base/.playground/app/pages/<feature>.tsx`, written in TSX with `defineSetupComponent` like its neighbours. Variants and edge cases (every prop combination, overflow, long titles) go in `<feature>-sandbox.tsx` beside it.

```sh
pnpm -C base dev --host 0.0.0.0 --port 3517
```

`--host 0.0.0.0` makes the playground reachable from other machines. Pick another port when 3517 is taken, and read the URL from the `Local:` / `Network:` lines.

Warm up before browser checks. The first browser load in a fresh checkout makes Vite pre-bundle newly discovered dependencies: the page gets a 504 `Outdated Optimize Dep` and reloads itself, and the dev log prints `Vite discovered new dependencies`. Open the page once, wait for that reload to settle, then start checking. Later starts reuse the cache in `base/.playground/node_modules/.cache/vite`.
