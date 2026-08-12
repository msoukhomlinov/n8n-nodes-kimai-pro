// nodes/KimaiPro/ai-tools/runtime.ts
import { createRequire } from 'module';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { z as ZodNamespace } from 'zod';
import type { ISupplyDataFunctions } from 'n8n-workflow';

type DynamicStructuredToolCtor = new (fields: {
    name: string;
    description: string;
        schema: any;
    func: (params: Record<string, unknown>) => Promise<string>;
}) => DynamicStructuredTool;

export type RuntimeZod = typeof ZodNamespace;
type LogWrapperFn = <T>(tool: T, executeFunctions: ISupplyDataFunctions) => T;

// This package's own name — belt-and-suspenders skip in the require.cache walk so a
// fallback resolution never anchors off our own bundled copy. Not the correctness
// mechanism — anchor-package identity (below) is.
const OWN_PACKAGE_NAME = 'n8n-nodes-kimai-pro';

// Anchor packages n8n owns (a community node never bundles these), used to reach n8n's
// DynamicStructuredTool. @n8n/n8n-nodes-langchain first: it is the package whose
// normalizeToolSchema runs the `instanceof DynamicStructuredTool` check, and it is always
// resident in require.cache by the time supplyData() runs (n8n invokes the tool through it).
const ANCHOR_CANDIDATES = ['@langchain/classic/agents', 'langchain/agents'] as const;

// require.cache key patterns matching n8n-owned trees. createRequire() from a module inside
// one of these trees walks n8n's real dependency graph to n8n's own copy of the target —
// independent of cache order and pnpm virtual-store path naming, which a bare-module-path
// match ('zod' / '@langchain/core') is not: under pnpm the cache key is the flat
// virtual-store realpath, which does not encode the dependent package, so a community node's
// own bundled zod/@langchain/core is indistinguishable by path from n8n's.
const LANGCHAIN_TREE_PATTERNS = [
    /[\\/]@n8n[\\/]n8n-nodes-langchain[\\/]/,
    /[\\/]@langchain[\\/]classic[\\/]/,
] as const;

// zod anchors: @n8n/n8n-nodes-langchain first (its normalizeToolSchema does `instanceof
// ZodType` against n8n's TOP-LEVEL zod), then n8n's core packages. Deliberately NOT anchored
// on @langchain/classic — that reaches its *nested* zod copy, whose class identity fails
// n8n's top-level instanceof ZodType check.
const ZOD_TREE_PATTERNS = [
    /[\\/]@n8n[\\/]n8n-nodes-langchain[\\/]/,
    /[\\/]n8n-workflow[\\/]/,
    /[\\/]n8n-core[\\/]/,
] as const;

const AI_UTILITIES_TREE_PATTERNS = [
    /[\\/]@n8n[\\/]ai-utilities[\\/]/,
    /[\\/]@n8n[\\/]n8n-nodes-langchain[\\/]/,
] as const;

// Host-anchor resolution: n8n's own module tree provides the exact DynamicStructuredTool/zod
// instances its Agent/MCP Trigger code checks `instanceof` against. Anchor on require.main
// (n8n's process entry point) so local devDependency copies never shadow n8n's own during
// development (npm link). require.main can be undefined under ESM launch / queue-mode
// workers; there is deliberately NO __filename fallback — that would resolve THIS package's
// bundled copy, whose class identity fails the host's instanceof checks. Returns null (never
// throws) so callers fall back to the identity-anchored require.cache walk below.
function resolveAnchorRequire(): NodeRequire | null {
    const mainFile = require.main?.filename;
    if (!mainFile) return null;

    const mainRequire = createRequire(mainFile);
    for (const candidate of ANCHOR_CANDIDATES) {
        try {
            return createRequire(mainRequire.resolve(candidate));
        } catch {
            // try next candidate
        }
    }
    return null;
}

// Identity-anchored require.cache fallback (pnpm-strict-isolated installs, where no
// filesystem anchor reaches the host copy). Scans require.cache for an already-loaded module
// whose key sits inside an n8n-owned anchor tree, then createRequire()s `id` FROM that
// module's filename — walking n8n's real dependency graph to n8n's own copy. `validate`
// rejects a resolved-but-wrong-shape module so the walk continues to the next candidate
// instead of returning a wrong-identity match. Must be called lazily (not at module load):
// n8n registers node files for discovery before any workflow runs, i.e. before LangChain is
// in the cache.
function requireFromCachedTree<T>(
    patterns: readonly RegExp[],
    id: string,
    validate: (mod: Record<string, unknown>) => T | undefined,
): T | undefined {
    try {
        const cache = require.cache;
        if (!cache) return undefined;
        const keys = Object.keys(cache);
        for (const pattern of patterns) {
            for (const key of keys) {
                if (key.includes(OWN_PACKAGE_NAME)) continue;
                if (!pattern.test(key)) continue;
                const entry = cache[key];
                if (!entry?.filename) continue;
                try {
                    const mod = createRequire(entry.filename)(id) as Record<string, unknown>;
                    const result = validate(mod);
                    if (result !== undefined) return result;
                } catch {
                    // this anchor could not resolve the target — try next entry
                }
            }
        }
    } catch {
        // best-effort — require.cache introspection is not guaranteed across Node versions
    }
    return undefined;
}

// All memoised on SUCCESS ONLY. A negative result must never latch: the anchor tree and
// cache are populated progressively during n8n startup, so a resolution that fails on an
// early call can succeed once n8n has finished loading its langchain-dependent nodes.
let _anchorRequire: NodeRequire | undefined;
let _RuntimeDST: DynamicStructuredToolCtor | undefined;
let _runtimeZod: RuntimeZod | undefined;
let _logWrapper: LogWrapperFn | undefined;

function getAnchorRequire(): NodeRequire | null {
    if (_anchorRequire) return _anchorRequire;
    const resolved = resolveAnchorRequire();
    if (resolved) _anchorRequire = resolved;
    return resolved;
}

function resolveRuntimeDST(): DynamicStructuredToolCtor | undefined {
    if (_RuntimeDST) return _RuntimeDST;

    const anchorRequire = getAnchorRequire();
    if (anchorRequire) {
        try {
                        const coreTools = anchorRequire('@langchain/core/tools') as Record<string, any>;
            if (typeof coreTools?.DynamicStructuredTool === 'function') {
                _RuntimeDST = coreTools.DynamicStructuredTool as DynamicStructuredToolCtor;
                return _RuntimeDST;
            }
        } catch {
            // fall through to identity-anchored cache walk
        }
    }

    const cached = requireFromCachedTree(LANGCHAIN_TREE_PATTERNS, '@langchain/core/tools', (mod) =>
        typeof mod.DynamicStructuredTool === 'function'
            ? (mod.DynamicStructuredTool as DynamicStructuredToolCtor)
            : undefined,
    );
    if (cached) _RuntimeDST = cached;
    return _RuntimeDST;
}

function resolveRuntimeZod(): RuntimeZod | undefined {
    if (_runtimeZod) return _runtimeZod;

    // Primary path: n8n's top-level zod (the copy n8n-nodes-langchain's normalizeToolSchema
    // uses for `instanceof ZodType`), resolved via require.main so local devDependency copies
    // never shadow it during development. No __filename fallback — that would resolve this
    // package's own zod.
    const mainFile = require.main?.filename;
    if (mainFile) {
        try {
            const zod = createRequire(mainFile)('zod') as RuntimeZod;
            if (zod) {
                _runtimeZod = zod;
                return _runtimeZod;
            }
        } catch {
            // fall through to identity-anchored cache walk
        }
    }

    // Identity-anchored fallback. Deliberately NOT resolved through the @langchain/classic
    // anchor require (that reaches its nested zod, which fails n8n's top-level instanceof
    // ZodType). Validate the shape (ZodType and object are functions) rather than trusting
    // the anchor alone.
    const cached = requireFromCachedTree(ZOD_TREE_PATTERNS, 'zod', (mod) =>
        typeof mod.ZodType === 'function' && typeof mod.object === 'function'
            ? (mod as unknown as RuntimeZod)
            : undefined,
    );
    if (cached) _runtimeZod = cached;
    return _runtimeZod;
}

export function getLazyRuntimeDST(): DynamicStructuredToolCtor {
    const ctor = resolveRuntimeDST();
    if (!ctor) {
        throw new Error(
            `[KimaiProAiTools] Failed to resolve DynamicStructuredTool from n8n's module tree ` +
            `(require.main host-anchor) or from an n8n-owned tree in Node's require.cache ` +
            `(pnpm-isolated fallback). instanceof DynamicStructuredTool checks would fail, so ` +
            `resolution failed clean rather than returning a foreign-tree copy. Ensure ` +
            `@n8n/n8n-nodes-langchain / @langchain/core is loaded in this n8n process.`,
        );
    }
    return ctor;
}

export function getLazyRuntimeZod(): RuntimeZod {
    const zod = resolveRuntimeZod();
    if (!zod) {
        throw new Error(
            `[KimaiProAiTools] Failed to resolve zod from n8n's module tree (require.main) or ` +
            `from an n8n-owned tree in Node's require.cache (pnpm-isolated fallback). instanceof ` +
            `ZodType checks would fail, so resolution failed clean rather than returning a ` +
            `foreign-tree copy. Ensure zod is loaded in this n8n process.`,
        );
    }
    return zod;
}

/**
 * getLazyLogWrapper — best-effort access to n8n's logWrapper utility (resolved lazily,
 * memoized on success). Falls back from the require.main anchor to the identity-anchored
 * require.cache walk (pnpm-isolated installs), and unwraps either the named export or a
 * default-exported logWrapper. Returns null if @n8n/ai-utilities is unavailable — graceful
 * degradation, the tool still works without it.
 *
 * Usage in supplyData():
 *   const logWrapper = getLazyLogWrapper();
 *   const wrapped = logWrapper ? logWrapper(tool, this) : tool; // context = this (ISupplyDataFunctions)
 *   return { response: wrapped };
 *
 * Do NOT use in execute() — logWrapper intercepts _call, only on the supplyData()→func() path.
 */
export function getLazyLogWrapper(): LogWrapperFn | null {
    if (_logWrapper) return _logWrapper;

    const anchorRequire = getAnchorRequire();
    if (anchorRequire) {
        try {
            const aiUtils = anchorRequire('@n8n/ai-utilities') as Record<string, unknown>;
                        const fn = (aiUtils as any)?.logWrapper ?? (aiUtils as any)?.default?.logWrapper;
            if (typeof fn === 'function') {
                _logWrapper = fn as LogWrapperFn;
                return _logWrapper;
            }
        } catch {
            // fall through to identity-anchored cache walk
        }
    }

    // @n8n/ai-utilities is n8n-owned and never bundled by a community node, so the
    // wrong-identity risk that motivates the other anchors does not apply here — this walk is
    // purely for pnpm-isolated recovery, used for consistency with the other resolvers.
    const cached = requireFromCachedTree(AI_UTILITIES_TREE_PATTERNS, '@n8n/ai-utilities', (mod) => {
                const fn = (mod as any).logWrapper ?? (mod as any).default?.logWrapper;
        return typeof fn === 'function' ? (fn as LogWrapperFn) : undefined;
    });
    if (cached) _logWrapper = cached;
    return _logWrapper ?? null;
}

// ---------------------------------------------------------------------------
// Proxy-based top-level exports — provide [[Construct]] / property access without eagerly
// resolving the runtime. If resolution fails at module load, the node still *registers* in
// n8n; the error surfaces only when the Proxy traps fire (i.e. inside supplyData()).
// ---------------------------------------------------------------------------

// IMPORTANT: target MUST be `function () {}`, not `{}` — see header note on ECMAScript §10.5.13.
export const RuntimeDynamicStructuredTool: DynamicStructuredToolCtor = new Proxy(
    function () {} as unknown as DynamicStructuredToolCtor,
    {
        construct(_target, args) {
            const Ctor = getLazyRuntimeDST();
                        return new (Ctor as any)(...args) as object;
        },
        get(_target, prop, receiver) {
            const Ctor = getLazyRuntimeDST();
            return Reflect.get(Ctor, prop, receiver);
        },
    },
) as DynamicStructuredToolCtor;

export const runtimeZod: RuntimeZod = new Proxy(
    {} as RuntimeZod,
    {
        get(_target, prop, receiver) {
            // Allow safe structural probes (Symbol.*, Promise thenable, .constructor) without
            // triggering resolution — frameworks and inspection utilities probe these.
            if (typeof prop === 'symbol' || prop === 'then' || prop === 'constructor') return undefined;
            const z = getLazyRuntimeZod();
            return Reflect.get(z, prop, receiver);
        },
    },
);
