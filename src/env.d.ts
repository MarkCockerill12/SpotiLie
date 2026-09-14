/**
 * Build-time environment, inlined by `bun build --env='SPOTILIE_*'`.
 *
 * To strip debug-only code from release bundles, test the variable directly at
 * the call site: `if (process.env.SPOTILIE_DEBUG === '1') …`. Bun (1.3.11)
 * folds that to `if (false)` and drops the branch — but it does NOT drop a
 * branch guarded by a const imported from another module (`if (DEBUG)`), even
 * though it folds that const to `!1`. Verified with a minimal bundle test.
 */
declare const process: { env: { SPOTILIE_DEBUG?: string } };
