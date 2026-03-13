# Pocket Dino Friend Style Guide

## Experience Promise
- The pet's face and body language should be readable before the user needs to parse numbers.
- The main HUD should support care decisions quickly without competing with the stage for attention.
- Motion should feel gentle and reassuring; comfort mode should reduce movement and increase text comfort.

## Visual Lanes
- Care lane: mint and soft sky tones for stability, recovery, and everyday interaction.
- Bond lane: rose and peach tones for closeness, praise, and emotional warmth.
- Alert lane: sand and indigo tones for growth checkpoints, fatigue, and caution states.

## HUD Rules
- The top header must fit on a 360x740 viewport without creating page scroll.
- Growth and current care focus live in one overview row so the user can read progress and next action at the same glance.
- Status bars stay compact and secondary; the stage remains the primary visual area.
- Chips should communicate identity, age, season, and bond tier in short phrases only.

## Pet Readability Rules
- Every state should combine a face cue and a body cue.
- Hungry, sleepy, dirty, sick, and naughty states should remain readable even if text is hidden.
- Bond depth should affect posture and warmth, not only labels.
- Growth stages must change silhouette, not just size.

## Dialogue Portrait Rules
- Dialogue uses a small portrait and sticker to reinforce the current emotional tone.
- Portrait palettes match the same care, bond, and alert lanes used by the HUD.
- Tap dialogue should feel intimate and brief; state hints should feel supportive, not noisy.

## Code Anchors
- Visual presentation data lives in `src/presentation.ts`.
- Runtime HUD and dialogue rendering lives in `src/ui.ts`.
- Pet silhouette, motion, and stage scene live in `src/canvas.ts`.
- Shared tokens and responsive behavior live in `src/style.css`.
