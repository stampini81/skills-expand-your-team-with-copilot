// Animated Git-style branch lines background
(function () {
  const canvas = document.getElementById("git-branch-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Read school colors from CSS custom properties
  const style = getComputedStyle(document.documentElement);
  const COLORS = [
    style.getPropertyValue("--primary").trim(),
    style.getPropertyValue("--primary-light").trim(),
    style.getPropertyValue("--secondary").trim(),
    style.getPropertyValue("--primary-dark").trim(),
    style.getPropertyValue("--secondary-light").trim(),
    style.getPropertyValue("--secondary-dark").trim(),
  ];

  const BRANCH_COUNT = 6;
  const branches = [];
  let resizeTimer = null;

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function createBranch(index) {
    const totalWidth = canvas.width;
    const x = (index / (BRANCH_COUNT - 1)) * totalWidth * 0.8 + totalWidth * 0.1;
    const segments = [];
    let y = -100;
    let cx = x + randomBetween(-60, 60);
    while (y < canvas.height + 200) {
      const nextY = y + randomBetween(80, 200);
      const nextX = cx + randomBetween(-80, 80);
      segments.push({ x1: cx, y1: y, x2: nextX, y2: nextY });
      y = nextY;
      cx = nextX;
    }
    return {
      segments,
      color: COLORS[index % COLORS.length],
      commits: [
        { progress: Math.random(), speed: randomBetween(0.0003, 0.0008) },
        { progress: Math.random() * 0.5, speed: randomBetween(0.0003, 0.0008) },
      ],
    };
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    branches.length = 0;
    for (let i = 0; i < BRANCH_COUNT; i++) {
      branches.push(createBranch(i));
    }
  }

  function getPointOnBranch(branch, progress) {
    const segs = branch.segments;
    if (!segs.length) return { x: 0, y: 0 };
    let totalLen = 0;
    const lengths = segs.map((s) => {
      const l = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      totalLen += l;
      return l;
    });
    const target = progress * totalLen;
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
      if (acc + lengths[i] >= target) {
        const t = (target - acc) / lengths[i];
        return {
          x: segs[i].x1 + t * (segs[i].x2 - segs[i].x1),
          y: segs[i].y1 + t * (segs[i].y2 - segs[i].y1),
        };
      }
      acc += lengths[i];
    }
    const last = segs[segs.length - 1];
    return { x: last.x2, y: last.y2 };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    branches.forEach((branch) => {
      const segs = branch.segments;
      if (!segs.length) return;

      // Draw branch line
      ctx.beginPath();
      ctx.moveTo(segs[0].x1, segs[0].y1);
      for (const seg of segs) {
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.strokeStyle = branch.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Animate commit dots along the line
      branch.commits.forEach((commit) => {
        commit.progress += commit.speed;
        if (commit.progress > 1) commit.progress = 0;

        const pos = getPointOnBranch(branch, commit.progress);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = branch.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw static commit nodes at segment junctions
      segs.forEach((seg, i) => {
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.arc(seg.x1, seg.y1, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = branch.color;
          ctx.fill();
        }
      });
    });

    requestAnimationFrame(draw);
  }

  // Debounced resize handler
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
  requestAnimationFrame(draw);
})();
