# SF CHAIN — Super Fast Chain

The built-in dashboard is a read-only explorer at `/dashboard` on the node's
Ethereum RPC port. `make stresstest` prints the actual URL; its persistent port
may differ from the regular node's default port 8545.

The overview shows committed TPS, process CPU usage, verification counters,
recent blocks, and recent transactions. Compute, storage, explorer, and log views
provide worker statistics, RocksDB metrics, persistence paths, SQLite WAL index
status, and indexed log search.

Click a transaction hash to inspect its sender, recipient, value, nonce, gas,
input, receipt, and signed bytes. Click a block to browse its transactions.
The explorer opens with a **Choose a block** selector listing the latest 30
populated blocks and their transaction counts. The newest is selected initially;
choosing another immediately shows its transactions in the table below.
An adjacent block-number field accepts any height, including empty blocks.
Hash/address search remains available under the expandable search control.
Deep links use `#tx/<hash>` and `#block/<height-or-hash>`. Transaction lists use
keyset pagination by descending height and position, so new blocks do not shift
older pages. Values and fees are represented as decimal strings to preserve
integer precision in JavaScript.

An empty block is explicitly labeled **Empty block**. In the stress test, the
sequencer can produce empty blocks while the generator prepares the next signed
batch. Block 200 in the reported screenshot was independently checked against
the SQLite index and the chain's history JSONL: both contained zero transactions.
Its count was correct. Populated blocks now expose their transaction lists
directly, including pagination for large blocks.

## Build and runtime

Authoring files:

- `crates/sfc/static/dashboard.html`: page structure and brand.
- `crates/sfc/dashboard/app.js`: explorer, metrics, Motion animations, Three.js.
- `crates/sfc/dashboard/styles.css`: Tailwind and component styling.
- `scripts/build_dashboard.mjs`: local asset bundling.

After changing frontend sources:

```sh
make dashboard
make release
```

Restart the node to load the rebuilt embedded assets. For a running stress test,
use `make stop`, then `make stresstest`. Its persistent chain is retained.
Generated JavaScript, CSS, image, and library license notices are included in the
Rust binary. Normal node startup requires no CDN or separate frontend server.

Three.js renders a decorative orbit at a capped 20 FPS with a low-power context.
Rendering pauses when the tab is hidden, a detail dialog is open, or another
dashboard view is selected. Reduced-motion preferences and the Motion toggle
disable animation. Displayed CPU usage covers node and GPU worker host processes;
it does not include the browser. GPU verification counters describe submitted
work, not hardware GPU utilization.

## Generated visual asset

Final project asset: `crates/sfc/static/frontier-orbit.png`.
Generated with OpenAI's built-in image generation tool, then copied into the
repository. The SF CHAIN wordmark is real HTML text; no lettering is baked into
the image.

Prompt:

> Create a premium abstract background asset for a professional blockchain explorer dashboard named SuperFrontier. Wide cinematic landscape, 1536x1024. A single precision-machined translucent glass torus with delicate concentric orbital lines, occupying the rightmost half, floating over a near-black midnight navy background (#080d16). Soft mint emerald rim light and restrained icy blue reflections, sophisticated industrial product photography, subtle depth, luxurious understated materials, very clean. Left half mostly empty dark negative space for real HTML interface text. No text, no letters, no logos, no charts, no UI, no stars, no coins, no cryptocurrency symbols. Low brightness, controlled bloom, high craft. Intended to be used behind a small dashboard header, not a full-page image.

## Verification

- Rust indexer tests cover empty blocks, transaction metadata, stable pagination
  while new blocks arrive, WAL readers, and index restart.
- Live API verification paged all 4,096 transactions in block 2677 exactly once.
- Browser checks covered the overview, an empty block, a populated block,
  loading more transactions, and transaction/receipt details.
- `scripts/test_stresstest.py` checks continuous GPU rounds, dashboard metrics,
  WAL search, persistent restart, stop during signing, SIGKILL recovery, and torn
  log recovery.
