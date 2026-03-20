/**
 * Animated Git-style branch lines background
 * Draws slowly-scrolling branch/merge lines with commit nodes,
 * styled in the school's lime-green palette.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("git-background");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // School lime-green color family — defined as [r, g, b, lineAlpha, commitAlpha]
  const BRANCH_DEFS = [
    [67,  160, 71,  0.30, 0.55], // --primary
    [118, 210, 117, 0.22, 0.48], // --primary-light
    [0,   112, 26,  0.20, 0.45], // --primary-dark
    [100, 200, 80,  0.18, 0.42],
    [56,  142, 60,  0.25, 0.52],
  ];

  const SCROLL_SPEED = 90; // pixels per second (consistent across refresh rates)
  const COMMIT_RADIUS = 5;

  let w = 0;
  let h = 0;
  let scrollY = 0;
  let lastTimestamp = null;

  // Tile: one repeating section of the git graph
  const TILE_HEIGHT = 480;
  let tile = null; // { laneXs, commits, merges }

  // ── Build the tile data ──────────────────────────────────────────────────

  function buildTile() {
    const laneCount = Math.max(4, Math.floor(w / 140));
    const margin = w * 0.05;
    const spacing = (w - 2 * margin) / (laneCount - 1);

    // Base x positions for each lane
    const laneXs = Array.from({ length: laneCount }, (_, i) => margin + i * spacing);

    // Commits: one per lane per "slot" (spaced every ~70 px, offset per lane)
    const commitSlotH = 70;
    const commits = [];
    for (let lane = 0; lane < laneCount; lane++) {
      const startY = 10 + lane * 8; // small per-lane stagger
      for (let y = startY; y < TILE_HEIGHT; y += commitSlotH) {
        commits.push({ lane, y });
      }
    }

    // Merge lines: connect occasional pairs of adjacent-lane commits
    const merges = [];
    for (let i = 0; i < commits.length; i++) {
      const c = commits[i];
      // ~18% chance a commit starts a branch/merge connector
      if (Math.random() > 0.18) continue;
      const direction = Math.random() < 0.5 ? -1 : 1;
      const targetLane = c.lane + direction;
      if (targetLane < 0 || targetLane >= laneCount) continue;
      // Find a commit on the target lane within a reasonable vertical window
      const candidate = commits.find(
        (d) => d.lane === targetLane && d.y > c.y + 20 && d.y < c.y + commitSlotH * 2
      );
      if (candidate) {
        merges.push({ from: c, to: candidate });
      }
    }

    return { laneXs, commits, merges, laneCount };
  }

  // ── Drawing ──────────────────────────────────────────────────────────────

  function branchColor(lane, alpha) {
    const def = BRANCH_DEFS[lane % BRANCH_DEFS.length];
    return `rgba(${def[0]}, ${def[1]}, ${def[2]}, ${alpha})`;
  }

  function drawTile(offsetY) {
    const { laneXs, commits, merges, laneCount } = tile;

    // 1. Draw vertical branch lines
    for (let i = 0; i < laneCount; i++) {
      ctx.beginPath();
      ctx.strokeStyle = branchColor(i, BRANCH_DEFS[i % BRANCH_DEFS.length][3]);
      ctx.lineWidth = 2;
      ctx.moveTo(laneXs[i], offsetY);
      ctx.lineTo(laneXs[i], offsetY + TILE_HEIGHT);
      ctx.stroke();
    }

    // 2. Draw merge / branch connector lines (bezier curves for smooth look)
    for (const m of merges) {
      const x1 = laneXs[m.from.lane];
      const y1 = offsetY + m.from.y;
      const x2 = laneXs[m.to.lane];
      const y2 = offsetY + m.to.y;

      ctx.beginPath();
      ctx.strokeStyle = branchColor(m.from.lane, BRANCH_DEFS[m.from.lane % BRANCH_DEFS.length][3]);
      ctx.lineWidth = 1.8;
      // Cubic bezier: control points give a smooth arc
      const cpY = y1 + (y2 - y1) * 0.5;
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1, cpY, x2, cpY, x2, y2);
      ctx.stroke();
    }

    // 3. Draw commit circles
    for (const c of commits) {
      const x = laneXs[c.lane];
      const y = offsetY + c.y;
      const def = BRANCH_DEFS[c.lane % BRANCH_DEFS.length];

      // Outer filled circle
      ctx.beginPath();
      ctx.fillStyle = branchColor(c.lane, def[4]);
      ctx.arc(x, y, COMMIT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // White inner dot for "hollow commit" look
      ctx.beginPath();
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.arc(x, y, COMMIT_RADIUS * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(timestamp) {
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000; // seconds
    lastTimestamp = timestamp;

    scrollY += SCROLL_SPEED * delta;

    ctx.clearRect(0, 0, w, h);

    const tilesNeeded = Math.ceil(h / TILE_HEIGHT) + 2;
    const baseOffset = -(scrollY % TILE_HEIGHT);

    for (let t = -1; t < tilesNeeded; t++) {
      drawTile(baseOffset + t * TILE_HEIGHT);
    }

    requestAnimationFrame(draw);
  }

  // ── Resize handling ──────────────────────────────────────────────────────

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    tile = buildTile();
  }

  // Debounce resize events
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  // ── Init ─────────────────────────────────────────────────────────────────
  resize();
  requestAnimationFrame(draw);
})();

