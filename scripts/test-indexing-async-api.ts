/**
 * Smoke test for async indexing APIs:
 * orchestrate -> (optional) run chunk(s) -> poll status
 *
 * Usage examples:
 *   pnpm test:indexing:async
 *   pnpm test:indexing:async -- --mode manager --manager 123456 --from 1 --to 3
 *   pnpm test:indexing:async -- --mode league --league 1305804 --from 1 --to 1
 *   pnpm test:indexing:async -- --base https://fpl-wrapped-live.vercel.app
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

type Mode = 'manager' | 'league';
type JsonRecord = Record<string, unknown>;

function getArg(name: string, fallback?: string): string | undefined {
    const idx = process.argv.indexOf(`--${name}`);
    if (idx >= 0 && process.argv[idx + 1]) {
        return process.argv[idx + 1];
    }
    return fallback;
}

function parseNumberArg(name: string, fallback?: number): number | undefined {
    const raw = getArg(name);
    if (!raw) {
        return fallback;
    }
    const value = parseInt(raw, 10);
    if (Number.isNaN(value)) {
        throw new Error(`Invalid --${name} value: ${raw}`);
    }
    return value;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestJson(url: string, init?: RequestInit): Promise<{ status: number; body: JsonRecord }> {
    const res = await fetch(url, init);
    const text = await res.text();

    let body: JsonRecord = {};
    try {
        body = text ? (JSON.parse(text) as JsonRecord) : {};
    } catch {
        throw new Error(`Non-JSON response (${res.status}) from ${url}: ${text.slice(0, 300)}`);
    }

    if (!res.ok) {
        const message = typeof body.error === 'string' ? body.error : `HTTP ${res.status}`;
        throw new Error(`${url} failed: ${message}`);
    }

    return { status: res.status, body };
}

async function run() {
    const base = getArg('base', process.env.INDEX_API_BASE_URL || 'https://fpl-wrapped-live.vercel.app')!;
    const mode = (getArg('mode', 'manager') as Mode);
    const fromGw = parseNumberArg('from', 1)!;
    const toGw = parseNumberArg('to', 1)!;
    const maxSteps = parseNumberArg('max-steps', 5)!;
    const maxIterations = parseNumberArg('max-iterations', 30)!;
    const pollMs = parseNumberArg('poll-ms', 1500)!;

    if (mode !== 'manager' && mode !== 'league') {
        throw new Error(`Unsupported --mode ${mode}. Use manager or league.`);
    }

    const managerId = parseNumberArg('manager', 1);
    const leagueId = parseNumberArg('league');

    console.log('🧪 Async Indexing API Smoke Test');
    console.log(`   Base URL: ${base}`);
    console.log(`   Mode: ${mode}`);
    console.log(`   Range: GW${fromGw} -> GW${toGw}`);

    const orchestrateUrl = `${base}/api/index/orchestrate`;

    const orchestrateBody: JsonRecord = mode === 'manager'
        ? {
            type: 'manager',
            manager_id: managerId,
            from_gw: fromGw,
            to_gw: toGw,
            max_steps: maxSteps,
            max_iterations: 1
        }
        : {
            type: 'league',
            league_id: leagueId,
            from_gw: fromGw,
            to_gw: toGw,
            max_steps: maxSteps,
            max_iterations: 1
        };

    if (mode === 'league' && !leagueId) {
        throw new Error('For --mode league, provide --league <id>.');
    }

    console.log(`\n1) Starting execution via ${orchestrateUrl}`);
    const started = await requestJson(orchestrateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orchestrateBody)
    });

    const executionId = started.body.execution_id;
    if (typeof executionId !== 'string' || !executionId) {
        throw new Error(`Orchestrate response missing execution_id: ${JSON.stringify(started.body)}`);
    }

    const startedStatus = started.body.status;
    console.log(`   ✅ Started: ${executionId} (status=${String(startedStatus)})`);

    if (startedStatus === 'completed') {
        console.log('\n✅ Execution completed successfully (within orchestrate call).');
        return;
    }

    if (startedStatus === 'failed') {
        throw new Error(`Execution failed during orchestrate: ${String(started.body.error ?? started.body.message ?? 'unknown error')}`);
    }

    const runUrl = `${base}/api/index/run/${executionId}`;
    const statusUrl = `${base}/api/index/status/${executionId}`;

    for (let i = 1; i <= maxIterations; i++) {
        console.log(`\n2.${i}) Running chunk (max_steps=${maxSteps})`);
        const runRes = await requestJson(runUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ max_steps: maxSteps })
        });

        const runStatus = runRes.body.status;
        const runMsg = runRes.body.message;
        console.log(`   run status: ${String(runStatus)} | ${String(runMsg ?? '')}`);

        console.log('   polling status...');
        const statusRes = await requestJson(statusUrl, { method: 'GET' });
        const status = statusRes.body.status;
        const progress = (statusRes.body.progress ?? {}) as JsonRecord;
        console.log(
            `   status: ${String(status)} | gw processed=${String(progress.gameweeks_processed ?? 0)} success=${String(progress.gameweeks_success ?? 0)} failed=${String(progress.gameweeks_failed ?? 0)} skipped=${String(progress.gameweeks_skipped ?? 0)}`
        );

        if (status === 'completed') {
            console.log('\n✅ Execution completed successfully.');
            return;
        }
        if (status === 'failed') {
            throw new Error(`Execution failed: ${String(statusRes.body.error ?? statusRes.body.message ?? 'unknown error')}`);
        }

        await sleep(pollMs);
    }

    throw new Error(`Execution did not complete after ${maxIterations} iterations. Increase --max-iterations or --max-steps.`);
}

run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Smoke test failed: ${message}`);
    process.exit(1);
});
