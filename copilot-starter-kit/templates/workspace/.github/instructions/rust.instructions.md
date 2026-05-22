---
description: "Use when working on Rust crates, cargo workflows, ownership/borrowing fixes, and performance-sensitive code."
applyTo: "**/*.rs"
---
# Rust Guidelines

- Favor correctness and readability before micro-optimization.
- Prefer explicit error propagation over panics in library code.
- Keep ownership and lifetimes simple where possible.
- Add unit/integration tests for behavior and regressions.
- Preserve cargo workspace conventions already in the repository.
