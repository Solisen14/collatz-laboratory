# The Collatz Laboratory

An interactive exploration of the Collatz conjecture and generalized integer dynamical systems.

## Project structure

The finished project is planned as one cohesive desktop-first web application with four areas:

- **Story** — a cinematic, scroll-driven mathematical narrative.
- **Visualize** — a creative workspace for generating branching Collatz visualizations.
- **Experiment** — a laboratory for exploring generalized `an+b` rules and orbit behaviour.
- **About** — sources, methodology, credits, and project notes.

## Current prototype

Version 0.1 is intentionally limited to the opening Story sequence so the group can settle the visual language before the rest of the application is built.

The opening currently explores:

1. The orbit of 3: `3 → 10 → 5 → 16 → 8 → 4 → 2 → 1`.
2. User-chosen seven-step examples starting at 20 and 21.
3. A deliberately over-strong first conjecture: every positive integer reaches 1 in exactly seven steps.
4. User-selected counterexamples 6, 40, or 42, each taking eight steps and merging into an earlier path.
5. A transition toward refining the conjecture.

Mathematical exposition written by the group will be added later. Prototype placeholders are marked `INSERT TEXT HERE`.

## Technology

The current prototype uses plain HTML, CSS, and JavaScript so it can be hosted directly with GitHub Pages. Later versions can be refactored if the visualizer or experiment engine requires a more complex architecture.
