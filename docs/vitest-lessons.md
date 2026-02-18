# Vitest in a Next.js / TypeScript Project — Lessons Learned

A practical reference for anyone adding Vitest to an existing Next.js or Node.js project, particularly when the codebase uses module singletons, ESM/CJS mixed environments, and third-party npm packages that need mocking.

---

## Table of Contents

1. [Project context](#1-project-context)
2. [Issue: ERR_REQUIRE_ESM on startup](#2-issue-err_require_esm-on-startup)
3. [Issue: vi.doMock inside a helper function doesn't take effect](#3-issue-vidomock-inside-a-helper-function-doesnt-take-effect)
4. [Issue: Arrow functions are not constructors](#4-issue-arrow-functions-are-not-constructors)
5. [Issue: vi.doMock doesn't intercept externalized node_modules](#5-issue-vidomock-doesnt-intercept-externalized-node_modules)
6. [Broader patterns: testing module-level singletons](#6-broader-patterns-testing-module-level-singletons)
7. [Misc gotchas and quick wins](#7-misc-gotchas-and-quick-wins)
8. [Recommended vitest.config.mts template](#8-recommended-vitestconfigmts-template)
9. [Key takeaways for tech leads](#9-key-takeaways-for-tech-leads)

---

## 1. Project context

| Property | Value |
|---|---|
| Framework | Next.js 16 / TypeScript 5 |
| Test runner | Vitest ^4.0.16 |
| Module format | No `"type": "module"` in package.json (CommonJS default) |
| Package manager | pnpm |
| Path alias | `@/` → project root |

The goal was to add unit test coverage for:
- A module-level Elasticsearch **singleton** client (`lib/elasticsearch/client.ts`)
- A pure transformer function (`lib/elasticsearch/transformer.ts`)
- An async indexing service with several external API calls (`lib/elasticsearch/indexing-service.ts`)
- An SSE stream parser for a chat agent (`lib/chat/elastic-agent.ts`)
- Pure utility functions (`lib/chat/utils.ts`)

---

## 2. Issue: ERR_REQUIRE_ESM on startup

### What happened

Creating `vitest.config.ts` and running `npx vitest run` threw:

```
Error: require() of ES Module /.../vitest/dist/config.js not supported.
ERR_REQUIRE_ESM
```

### Why

Vitest v4 bundles Vite v7, which is **ESM-only**. When a project has no `"type": "module"` in `package.json`, Node treats `.ts` files as CommonJS. Vitest tries to `require()` the config file, which fails because its own internals are ESM.

### Fix

Rename the config file to **`.mts`** (or `.mjs` for plain JS). The `.mts` extension forces Node — and the TypeScript compiler — to treat the file as ESM regardless of the package-level module setting.

```
vitest.config.ts   ❌  (CJS context, fails with ERR_REQUIRE_ESM in Vitest v4)
vitest.config.mts  ✅  (explicitly ESM, always works)
```

### Lesson

> When Vitest (or any Vite-based tool) starts spitting `ERR_REQUIRE_ESM`, your first move is to check the **extension** of your config file, not the content. One character difference (`.ts` → `.mts`) is the entire fix.

---

## 3. Issue: `vi.doMock` inside a helper function doesn't take effect

### What happened

A shared helper was written to reduce repetition:

```typescript
async function clientWithFeatures(esEnabled: boolean, envOverrides, esMock?) {
  vi.resetModules();
  vi.doMock('@/lib/config/features', () => ({ FEATURES: { ELASTICSEARCH_ENABLED: esEnabled } }));
  if (esMock) vi.doMock('@elastic/elasticsearch', esMock);  // ← inside helper
  // set env vars...
  return import('../../lib/elasticsearch/client');
}
```

Tests that relied on the `@elastic/elasticsearch` mock received the real package instead of the mock. The `@/lib/config/features` mock always worked fine.

### Why

`vi.doMock` (the non-hoisted runtime counterpart to `vi.mock`) **is evaluated in the calling scope's module context**. When called from inside an async helper that is itself imported into the test file, the mock registration may not be visible to the module cache that `vi.resetModules()` just created — the timing of when the factory is registered relative to when `import()` resolves the dependency graph is subtle.

More importantly: `vi.mock` (the static, hoisted form) is transformed at compile time and always runs before any imports. `vi.doMock` is dynamic, but it still depends on being invoked in the **same execution tick** as the dynamic `import()` that follows it. Wrapping it in an async helper adds an extra layer of indirection that breaks this guarantee in some Vitest versions.

### Fix

Move `vi.resetModules()` and `vi.doMock()` calls **directly into the test body**, immediately before `await import(...)`. Do not delegate them to a shared function.

```typescript
// ❌ Fragile — mocks inside helper
it('creates a client', async () => {
  const { getESClient } = await clientWithFeatures(true, VALID_ENV, makeESMock);
  expect(getESClient()).not.toBeNull();
});

// ✅ Reliable — mocks inline in the test
it('creates a client', async () => {
  setValidEnv();
  vi.resetModules();
  vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
  vi.doMock('@elastic/elasticsearch', makeESMock);
  const { getESClient } = await import('../../lib/elasticsearch/client');
  expect(getESClient()).not.toBeNull();
});
```

Yes, it's more verbose. Yes, it's the correct approach.

### Lesson

> **`vi.doMock` is not magic — it's positional.** The contract is: call `vi.resetModules()`, then immediately call `vi.doMock(...)`, then immediately `await import(...)`. Any indirection (helper functions, extra awaits, `.then()` chains) between mock registration and module import risks breaking the mock. Prefer verbosity over abstraction here.

---

## 4. Issue: Arrow functions are not constructors

### What happened

Tests that needed a working `Client` instance used:

```typescript
vi.doMock('@elastic/elasticsearch', () => ({
  Client: vi.fn().mockImplementation(() => ({ close: vi.fn() })),  // ← arrow fn
}));
```

Vitest printed a warning and the test failed:

```
[vitest] The vi.fn() mock did not use 'function' or 'class' in its implementation
TypeError: () => ({ close: vi.fn() }) is not a constructor
```

The source code does `new Client({...})`. Arrow functions cannot be invoked with `new`.

### Fix

Use a regular function expression (or a class) for any mock that will be called with `new`:

```typescript
// ❌ Arrow function — cannot be 'new'd
Client: vi.fn().mockImplementation(() => ({ close: vi.fn() }))

// ✅ Regular function — works as a constructor
Client: vi.fn().mockImplementation(function() {
  return { close: vi.fn() };
})

// ✅ Class — also works
Client: vi.fn().mockImplementation(class {
  close = vi.fn();
})
```

### Lesson

> When mocking a class or any symbol that production code calls with `new`, always use `function` or `class` syntax in `mockImplementation`. This is a JavaScript fundamental: **arrow functions have no `[[Construct]]` internal method** — they can never be constructors regardless of what wraps them.

---

## 5. Issue: `vi.doMock` doesn't intercept externalized node_modules

### What happened

Even after fixing the helper-function issue and the arrow-function issue, `@elastic/elasticsearch` still wasn't being mocked. The real package was being loaded.

### Why

Vitest (via Vite) **externalizes** `node_modules` by default in the `node` test environment. Externalized modules bypass Vite's module transform pipeline and are loaded directly by Node's native `require`/`import`. Because `vi.doMock` works by intercepting Vite's **module registry**, it has no effect on externalized modules.

The `@/lib/config/features` mock worked fine because it's a local file that goes through Vite's transform. `@elastic/elasticsearch` is a package in `node_modules` and was being bypassed.

### Fix

In `vitest.config.mts`, add the package to `server.deps.inline`:

```typescript
export default defineConfig({
  test: {
    server: {
      deps: {
        inline: ['@elastic/elasticsearch'],
      },
    },
  },
});
```

This tells Vite to **bundle and transform** that package through its own pipeline, making it visible to the mock registry.

### When to use `inline`

- Any npm package you need to `vi.doMock` or `vi.mock` in tests
- Packages that use unusual module formats (e.g., mixed CJS/ESM)
- Packages whose source maps cause warnings (`"Sourcemap points to missing source files"`)

### Caution

Inlining a package means Vite transforms it, which takes longer and can occasionally expose compatibility issues. Only inline packages you actually need to mock. For most packages that you use but don't mock in tests, leave them externalized.

### Lesson

> If `vi.doMock('some-npm-package', ...)` does nothing to a third-party package, the package is almost certainly being externalized. **`server.deps.inline` is the lever.** Add it to the config and the mock will take effect.

---

## 6. Broader patterns: testing module-level singletons

### The problem with singletons

`lib/elasticsearch/client.ts` uses module-level variables:

```typescript
let esClient: Client | null = null;
let connectionAttempted = false;
```

These are initialized once when the module is first `import`ed. Subsequent imports from the module cache return the **same object** — the singleton is already set. This means:

- Test A initializes `esClient = someRealClient`
- Test B imports the same module → `esClient` is still set from Test A
- Test B's assertions are wrong because they're testing Test A's state

### The solution: `vi.resetModules()` + dynamic `import()`

```typescript
// Each test gets a fresh module with fresh singleton state
vi.resetModules();                           // 1. Clear module cache
vi.doMock('...', () => ({ ... }));           // 2. Register mocks
const { fn } = await import('../../lib/elasticsearch/client');  // 3. Fresh import
```

`vi.resetModules()` clears Vitest's module registry so the next `import()` re-executes the module file from scratch. The singleton variables are re-initialized to their default values.

### Cleanup in afterEach

```typescript
afterEach(() => {
  clearESEnv();          // Remove any env vars this test set
  vi.resetModules();     // Ensure next test starts clean
  vi.restoreAllMocks();  // Restore any spied-on functions
});
```

Note: `vi.resetModules()` in `afterEach` is defensive — the next test should also call it before its `vi.doMock` + `import`. Having it in `afterEach` means a test failure won't leave dirty state for the next test.

### Env var management

```typescript
const VALID_URL = 'https://es.example.com';
const VALID_KEY = 'test-key';

function setValidEnv() {
  process.env.ELASTICSEARCH_URL = VALID_URL;
  process.env.ELASTICSEARCH_API_KEY = VALID_KEY;
}
function clearESEnv() {
  delete process.env.ELASTICSEARCH_URL;
  delete process.env.ELASTICSEARCH_API_KEY;
}
```

Keep env helpers simple: set what you need in the test, clear in `afterEach`. Avoid complex save/restore logic — it creates hard-to-debug state leakage between tests.

### Full singleton test template

```typescript
describe('getESClient', () => {
  afterEach(() => {
    clearESEnv();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns null when feature is disabled', async () => {
    setValidEnv();                                              // 1. env
    vi.resetModules();                                          // 2. clear cache
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(false));  // 3. mock
    const { getESClient } = await import('../../lib/module'); // 4. fresh import
    expect(getESClient()).toBeNull();                          // 5. assert
  });
});
```

---

## 7. Misc gotchas and quick wins

### Path alias resolution

If your TypeScript uses `@/` path aliases, add the same resolution to your Vitest config:

```typescript
import path from 'path';
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

Without this, imports like `import { FEATURES } from '@/lib/config/features'` will fail in tests with a "Cannot find module" error.

### `vi.mock` vs `vi.doMock`

| | `vi.mock` | `vi.doMock` |
|---|---|---|
| Hoisted | Yes (compile-time) | No (runtime) |
| Works at top level | Yes | Must be inside function/test |
| Works after `resetModules` | Yes (re-hoisted each time) | Yes if called before `import()` |
| Works in helpers | Sometimes | Unreliable |

**Rule of thumb:** Use `vi.mock` at the top of the file for mocks that apply to every test in the file. Use `vi.doMock` inside individual tests when different tests need different mock behaviour for the same module.

### Top-level `await` for module-wide mocks

For services that use the same mocks across all tests, you can use top-level `await`:

```typescript
vi.mock('../../lib/fpl-api', () => ({ getBootstrapData: vi.fn() }));
vi.mock('../../lib/elasticsearch/client', () => ({ getESClient: vi.fn() }));

// This runs after vi.mock hoisting:
const { indexManagerGameweek } = await import('../../lib/elasticsearch/indexing-service');
```

This pattern avoids repeating the `import` in every test and works well when the mock behaviour is consistent across the describe block. Each `it` block only needs to `.mockResolvedValue(...)` the already-imported mock functions.

### Mocking `fs` for file reads

```typescript
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('mocked content'),
  existsSync: vi.fn().mockReturnValue(true),
}));
```

`fs` is a Node built-in but goes through Vite's pipeline just fine — no need for `server.deps.inline`.

### Mocking `fetch` (global)

```typescript
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ result: 'ok' }),
}));
```

Restore with `vi.unstubAllGlobals()` in `afterEach`.

### Regex pitfall in URL assertions

When asserting that a URL doesn't contain double slashes:

```typescript
// ❌ Fails — https:// legitimately contains //
expect(url).not.toMatch(/\/\//);

// ✅ Correct — checks specifically for invalid double slashes in the path
expect(url).not.toContain('//api');
```

---

## 8. Recommended `vitest.config.mts` template

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: false,
    server: {
      deps: {
        // List npm packages you need to vi.doMock/vi.mock here.
        // Only add packages you actually mock in tests.
        inline: [
          '@elastic/elasticsearch',
          // 'some-other-package',
        ],
      },
    },
  },
  resolve: {
    alias: {
      // Mirror your tsconfig paths here
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**Why `.mts` and not `.ts`?** See [Issue 2](#2-issue-err_require_esm-on-startup) above.

---

## 9. Key takeaways for tech leads

### 1. Module mocking is not magic — it has a strict execution order

The contract for dynamic mocking is:
```
vi.resetModules() → vi.doMock(...) → await import(...)
```
Any deviation from this order — extra awaits, helper functions, `.then()` chains — can silently break the mock. Test authors need to understand this, not just copy-paste patterns.

### 2. Externalized packages are invisible to the mock registry

Vitest externalizes `node_modules` by default. `server.deps.inline` opts specific packages into Vite's transform pipeline, making them mockable. Without this, `vi.doMock('some-package')` is silently ignored — no error, just the real package.

This is a category of failure that is particularly hard to debug because there is no obvious error. The test just behaves as if the mock isn't there.

### 3. Singletons require module-level resets between tests

Code that sets module-level state on initialization (singletons, cached configs, lazy-initialized clients) must be re-imported fresh for each test that needs different state. `vi.resetModules()` is the mechanism. Design test suites around this from the start — retrofitting it is painful.

### 4. ESM/CJS boundaries cause pain in Vitest v4+

Vitest v4 is ESM-only internally. Projects without `"type": "module"` are CJS by default. The config file extension (`.mts`, not `.ts`) is the first friction point. There may be others — packages that have different CJS and ESM entry points, or that use `__dirname`/`__filename` which aren't available in ESM. Plan for this when upgrading Vitest.

### 5. Boilerplate repetition in tests is acceptable

The temptation to DRY up test setup into shared helpers is strong. Resist it for mock-heavy singleton tests. The explicit `vi.resetModules() → vi.doMock → import` sequence must live in the test body. The slight verbosity is a worthwhile trade for reliability and debuggability.

### 6. Mock factories must match how production code calls them

A mock of a class must use a constructor-capable function (`function` or `class`, not an arrow function). A mock of a module with named exports must return an object with those exact named properties. Reading the source code of what you're mocking — not just its TypeScript types — is often necessary.

### 7. Test isolation is a design constraint, not an afterthought

If tests are hard to write because of singletons, global state, or tightly coupled configuration, that's feedback about the production code design. The difficulty in testing `client.ts` (singleton + env vars + feature flags all intertwined) reflects real complexity in the module. Consider whether a factory function or dependency injection would make both the code and tests cleaner.
