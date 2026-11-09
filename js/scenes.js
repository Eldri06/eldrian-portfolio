/* 3D scenes: dotted globe in the hero, cube sculpture in About,
   wireframe terrain in the footer.
   Loaded as a module; Three.js is only downloaded when the browser has
   WebGL and the visitor hasn't asked for reduced motion. */

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const INK = 0x121211;
const ACID = 0xc8ff00;

const small = window.matchMedia("(max-width: 899px)");

/* Read a color token from the page, e.g. --fg, so 3D follows the theme. */
function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/* Recolor every ink-colored material in a scene to the theme's text
   color, now and whenever the theme changes. */
function followTheme(scene) {
  const targets = [];
  scene.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach((m) => {
      if (m.uniforms && m.uniforms.uColor && m.uniforms.uColor.value.getHex() === INK) targets.push(m.uniforms.uColor.value);
      else if (m.color && m.color.getHex() === INK) targets.push(m.color);
    });
  });
  const apply = () => {
    const c = cssColor("--fg", "#121211");
    targets.forEach((col) => col.set(c));
  };
  apply();
  document.addEventListener("themechange", apply);
}
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

/* Run a render loop only while the element is on screen. */
function loopWhileVisible(el, frame) {
  let visible = false;
  let raf = 0;
  const tick = (t) => {
    frame(t / 1000);
    if (visible) raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver((entries) => {
    const now = entries[0].isIntersecting;
    if (now && !visible) {
      visible = true;
      raf = requestAnimationFrame(tick);
    } else if (!now) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  }).observe(el);
}

function makeRenderer(THREE, host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  // Phones get a lower pixel ratio so the scenes stay smooth on battery.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small.matches ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  return renderer;
}

/* ---------------- Globe ---------------- */

function latLonToVec(THREE, lat, lon, r) {
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(phi) * Math.sin(theta), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(theta));
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* Shared dot shader: size follows the light like a printed dither,
   the back of the sphere fades, and a top-down sweep reveals it. */
function dotMaterial(THREE, renderer, opts) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(opts.color) },
      uLight: { value: new THREE.Vector3(-0.55, 0.65, 0.9).normalize() },
      uSize: { value: opts.size },
      uRatio: { value: renderer.getPixelRatio() },
      uAlpha: { value: opts.alpha },
      uReveal: { value: 0 },
      uHit: { value: new THREE.Vector3(0, 0, 1) },
      uHitAmt: { value: 0 }
    },
    vertexShader: `
      uniform vec3 uLight;
      uniform float uSize;
      uniform float uRatio;
      uniform float uReveal;
      uniform vec3 uHit;
      uniform float uHitAmt;
      varying float vLight;
      varying float vFront;
      varying float vShow;
      varying float vBump;
      void main() {
        float d = distance(normalize(position), uHit);
        vBump = smoothstep(0.42, 0.0, d) * uHitAmt;
        vec3 p = position * (1.0 + vBump * 0.09);
        vec3 n = normalize(mat3(modelMatrix) * position);
        vLight = max(dot(n, uLight), 0.0);
        vFront = n.z;
        float edge = 1.15 - uReveal * 2.5;
        vShow = smoothstep(edge, edge + 0.35, position.y);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * uRatio * (0.35 + vLight * 1.0 + vBump * 0.9) * (4.2 / -mv.z) * vShow;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vLight;
      varying float vFront;
      varying float vShow;
      varying float vBump;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (dot(c, c) > 0.25) discard;
        float a = vFront > -0.05 ? uAlpha * (0.55 + vLight * 0.45) : uAlpha * 0.16;
        a = min(1.0, a + vBump * 0.5);
        gl_FragColor = vec4(uColor, a * vShow);
      }
    `
  });
}

async function initGlobe(THREE, host) {
  // Land dots. The version tag stops browsers (Safari especially) from
  // reusing an old cached copy; if that fails, try the plain path.
  let LAND = [];
  for (const path of ["./land.js?v=20261109", "./land.js"]) {
    try {
      LAND = (await import(path)).default || [];
      if (LAND.length) break;
    } catch (e) {
      console.warn("Globe: could not load land dots from " + path, e);
    }
  }

  const renderer = makeRenderer(THREE, host);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 4.4);

  const tilt = new THREE.Group(); // scroll + mouse tilt
  const globe = new THREE.Group(); // spin
  tilt.add(globe);
  scene.add(tilt);

  // Hides things on the far side (pin, arcs, packets).
  const occluder = new THREE.Mesh(
    new THREE.SphereGeometry(0.985, 64, 64),
    new THREE.MeshBasicMaterial({ colorWrite: false })
  );
  occluder.renderOrder = -1;
  globe.add(occluder);

  // Land: real continents from Natural Earth, one dot per sample.
  const landPos = new Float32Array((LAND.length / 2) * 3);
  for (let i = 0, j = 0; i < LAND.length; i += 2, j += 3) {
    const v = latLonToVec(THREE, LAND[i], LAND[i + 1], 1);
    landPos[j] = v.x;
    landPos[j + 1] = v.y;
    landPos[j + 2] = v.z;
  }
  const landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute("position", new THREE.BufferAttribute(landPos, 3));
  const landMat = dotMaterial(THREE, renderer, { color: INK, size: 3.4, alpha: 0.85 });
  globe.add(new THREE.Points(landGeo, landMat));

  // Ocean: a sparse, faint lattice so the sphere still reads as round.
  const OCEAN = 2600;
  const oceanPos = new Float32Array(OCEAN * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < OCEAN; i++) {
    const y = 1 - (i / (OCEAN - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    oceanPos[i * 3] = Math.cos(th) * rad;
    oceanPos[i * 3 + 1] = y;
    oceanPos[i * 3 + 2] = Math.sin(th) * rad;
  }
  const oceanGeo = new THREE.BufferGeometry();
  oceanGeo.setAttribute("position", new THREE.BufferAttribute(oceanPos, 3));
  const oceanMat = dotMaterial(THREE, renderer, { color: INK, size: 1.7, alpha: 0.32 });
  globe.add(new THREE.Points(oceanGeo, oceanMat));

  // Outline ring, fixed to the camera, so the edge is always crisp.
  const outline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 160 }, (_, i) => {
        const a = (i / 160) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 1.004, Math.sin(a) * 1.004, 0);
      })
    ),
    new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0 })
  );
  scene.add(outline);

  // Pin on Tagum City.
  const TAGUM = { lat: 7.45, lon: 125.81 };
  const tagum = latLonToVec(THREE, TAGUM.lat, TAGUM.lon, 1);
  const px = renderer.getPixelRatio();
  const fixedDot = (color, size) =>
    new THREE.PointsMaterial({ color, size: size * px, sizeAttenuation: false, transparent: true, depthTest: true });

  const pinGeo = new THREE.BufferGeometry().setFromPoints([tagum.clone().multiplyScalar(1.012)]);
  const pinHalo = new THREE.Points(pinGeo, fixedDot(INK, 17));
  const pinCore = new THREE.Points(pinGeo, fixedDot(ACID, 10));
  pinCore.renderOrder = 3;
  globe.add(pinHalo, pinCore);

  const pulse = new THREE.Mesh(
    new THREE.RingGeometry(0.035, 0.045, 48),
    new THREE.MeshBasicMaterial({ color: INK, transparent: true, side: THREE.DoubleSide })
  );
  pulse.position.copy(tagum.clone().multiplyScalar(1.006));
  pulse.lookAt(tagum.clone().multiplyScalar(2));
  globe.add(pulse);

  // Arcs from Tagum to cities around the world, each with a moving packet.
  const CITIES = [
    [14.6, 121.0], [1.35, 103.82], [35.68, 139.69], [-33.87, 151.21],
    [25.2, 55.27], [51.5, -0.12], [37.77, -122.42], [22.32, 114.17], [-6.2, 106.85]
  ];
  const arcs = [];
  const arcLineMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.0 });
  const SEG = 72;
  CITIES.forEach((c, k) => {
    const to = latLonToVec(THREE, c[0], c[1], 1);
    const angle = tagum.angleTo(to);
    const lift = 0.08 + angle * 0.22;
    const pts = [];
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      // spherical interpolation, lifted off the surface in the middle
      const sin = Math.sin(angle);
      const a = Math.sin((1 - t) * angle) / sin;
      const b = Math.sin(t * angle) / sin;
      const p = tagum.clone().multiplyScalar(a).add(to.clone().multiplyScalar(b));
      p.setLength(1 + Math.sin(Math.PI * t) * lift);
      pts.push(p);
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcLineMat);
    globe.add(line);

    const end = new THREE.Points(new THREE.BufferGeometry().setFromPoints([to.clone().multiplyScalar(1.01)]), fixedDot(INK, 6));
    end.material.opacity = 0;
    globe.add(end);

    const packetGeo = new THREE.BufferGeometry().setFromPoints([pts[0].clone()]);
    const halo = new THREE.Points(packetGeo, fixedDot(INK, 9));
    const core = new THREE.Points(packetGeo, fixedDot(ACID, 5));
    core.renderOrder = 3;
    globe.add(halo, core);
    arcs.push({ pts, packetGeo, halo, core, end, offset: k / CITIES.length, speed: 0.16 + (k % 3) * 0.03 });
  });

  // Orbit ring of dots with a small satellite.
  const orbit = new THREE.Group();
  orbit.rotation.set(1.15, 0, 0.42);
  scene.add(orbit);
  const RING = 220;
  const ringPos = new Float32Array(RING * 3);
  for (let i = 0; i < RING; i++) {
    const a = (i / RING) * Math.PI * 2;
    ringPos[i * 3] = Math.cos(a) * 1.38;
    ringPos[i * 3 + 1] = 0;
    ringPos[i * 3 + 2] = Math.sin(a) * 1.38;
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
  const ringMat = new THREE.PointsMaterial({ color: INK, size: 2 * px, sizeAttenuation: false, transparent: true, opacity: 0 });
  orbit.add(new THREE.Points(ringGeo, ringMat));

  const sat = new THREE.Group();
  const satBox = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshBasicMaterial({ color: ACID }));
  const satEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(satBox.geometry),
    new THREE.LineBasicMaterial({ color: INK })
  );
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.004, 0.05), new THREE.MeshBasicMaterial({ color: INK }));
  sat.add(satBox, satEdges, panel);
  sat.scale.setScalar(0);
  orbit.add(sat);

  // Face the Philippines first.
  const baseY = -(TAGUM.lon * Math.PI) / 180;
  let spin = baseY;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;

  // Drag to spin (both axes), with inertia. Listeners sit on window
  // during a drag so it keeps working even if the pointer leaves.
  let tiltDrag = 0;
  let velY = 0;
  let lastY = 0;
  host.addEventListener("pointerdown", (e) => {
    e.preventDefault(); // stop text selection on Safari
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    host.classList.add("is-dragging", "was-touched");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velocity = dx * 0.007;
    velY = dy * 0.004;
    spin += velocity;
    tiltDrag = Math.max(-0.6, Math.min(0.6, tiltDrag + velY));
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    host.classList.remove("is-dragging");
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);

  // Hover: dots under the pointer swell and lift, and a ring marks the spot.
  const hoverRay = new THREE.Raycaster();
  const hoverNdc = new THREE.Vector2(9, 9);
  let hoverOn = false;
  let hitAmt = 0;
  const hitLocal = new THREE.Vector3(0, 0, 1);
  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    hoverNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    hoverOn = true;
  });
  host.addEventListener("pointerleave", () => {
    hoverOn = false;
  });

  const marker = new THREE.Group();
  const markerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.075, 0.085, 64),
    new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false })
  );
  const markerDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.018, 24),
    new THREE.MeshBasicMaterial({ color: ACID, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false })
  );
  markerDot.renderOrder = 4;
  markerRing.renderOrder = 4;
  marker.add(markerRing, markerDot);
  globe.add(marker);

  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  // Scroll: the globe drifts up, grows and turns as the hero leaves.
  const hero = host.closest(".hero") || host.parentElement;
  let scrollP = 0;
  const onScroll = () => {
    const r = hero.getBoundingClientRect();
    scrollP = clamp01(-r.top / Math.max(1, r.height));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  // Intro starts once the preloader is gone.
  let introStart = null;
  const root = document.documentElement;

  let last = 0;
  loopWhileVisible(host, (t) => {
    const dt = Math.min(0.05, t - (last || t));
    last = t;

    if (introStart === null && root.classList.contains("is-ready")) introStart = t + 0.2;
    const intro = introStart === null ? 0 : clamp01((t - introStart) / 2.2);
    const k = easeOut(intro);

    landMat.uniforms.uReveal.value = k;
    oceanMat.uniforms.uReveal.value = k;
    outline.material.opacity = 0.16 * k;
    ringMat.opacity = 0.35 * clamp01((intro - 0.5) * 2);
    sat.scale.setScalar(easeOut(clamp01((intro - 0.6) * 2.5)));

    // Spin: slow drift plus whatever the drag left behind.
    if (!dragging) {
      velocity *= 0.95;
      spin += velocity + dt * 0.06;
    }
    globe.rotation.y = spin;

    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    if (!dragging) tiltDrag *= 0.97;
    tilt.rotation.x = 0.22 + my * 0.22 + scrollP * 0.5 + tiltDrag;

    // Hover hit on the sphere, in the globe's own space.
    let hitting = false;
    if (hoverOn && !dragging) {
      hoverRay.setFromCamera(hoverNdc, camera);
      const hits = hoverRay.intersectObject(occluder, false);
      if (hits.length) {
        hitting = true;
        hitLocal.copy(globe.worldToLocal(hits[0].point.clone())).normalize();
      }
    }
    hitAmt += ((hitting ? 1 : 0) - hitAmt) * 0.12;
    landMat.uniforms.uHit.value.copy(hitLocal);
    oceanMat.uniforms.uHit.value.copy(hitLocal);
    landMat.uniforms.uHitAmt.value = hitAmt;
    oceanMat.uniforms.uHitAmt.value = hitAmt;
    marker.position.copy(hitLocal).multiplyScalar(1.03);
    marker.lookAt(hitLocal.clone().multiplyScalar(3).applyMatrix4(globe.matrixWorld));
    markerRing.material.opacity = 0.8 * hitAmt;
    markerDot.material.opacity = hitAmt;
    marker.scale.setScalar(0.8 + hitAmt * 0.2 + Math.sin(t * 4) * 0.04 * hitAmt);
    tilt.rotation.z = -0.08 + mx * 0.06;
    tilt.position.y = scrollP * 0.35;
    const s = (0.86 + k * 0.14) * (1 + scrollP * 0.25);
    tilt.scale.setScalar(s);

    orbit.rotation.y = t * 0.12;
    const sa = t * 0.5;
    sat.position.set(Math.cos(sa) * 1.38, 0, Math.sin(sa) * 1.38);
    sat.rotation.set(t * 0.8, t * 0.5, 0);

    // Pin pulse.
    const p = (t * 0.55) % 1;
    pulse.scale.setScalar(1 + p * 1.3);
    pulse.material.opacity = 0.55 * (1 - p) * k;
    pinHalo.material.opacity = k;
    pinCore.material.opacity = k;

    // Arcs draw in after the land, then packets travel along them.
    const arcsOn = clamp01((intro - 0.55) * 2.2);
    arcLineMat.opacity = 0.32 * arcsOn;
    arcs.forEach((a) => {
      const u = (t * a.speed + a.offset) % 1;
      const idx = Math.floor(u * SEG);
      const f = u * SEG - idx;
      const pA = a.pts[idx];
      const pB = a.pts[Math.min(SEG, idx + 1)];
      const pos = a.packetGeo.attributes.position;
      pos.setXYZ(0, pA.x + (pB.x - pA.x) * f, pA.y + (pB.y - pA.y) * f, pA.z + (pB.z - pA.z) * f);
      pos.needsUpdate = true;
      const fade = Math.sin(Math.PI * u) * arcsOn;
      a.halo.material.opacity = fade;
      a.core.material.opacity = fade;
      a.end.material.opacity = 0.7 * arcsOn;
    });

    renderer.render(scene, camera);
  });

  followTheme(scene);

  host.classList.add("is-live");
}

/* ---------------- About: cube sculpture ---------------- */

function initCubes(THREE, host) {
  const renderer = makeRenderer(THREE, host);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(5.2, 4.1, 6.2);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  const SIZE = 0.6;
  const GAP = 0.76;
  const boxGeo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const inkMat = new THREE.MeshBasicMaterial({ color: INK });
  const acidMat = new THREE.MeshBasicMaterial({ color: ACID });
  const lineChalk = new THREE.LineBasicMaterial({ color: 0xf1f0eb, transparent: true, opacity: 0.6 });
  const lineInk = new THREE.LineBasicMaterial({ color: INK });

  const cubes = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const cell = new THREE.Group();
        const mesh = new THREE.Mesh(boxGeo, inkMat);
        const edges = new THREE.LineSegments(edgeGeo, lineChalk);
        cell.add(mesh, edges);
        const home = new THREE.Vector3(x * GAP, y * GAP, z * GAP);
        // start scattered outward, assemble when seen
        const dir = home.clone().normalize();
        const scatter = home.clone().add(dir.multiplyScalar(2.2 + Math.random() * 1.6));
        cell.position.copy(scatter);
        cell.rotation.set(Math.random() * 3, Math.random() * 3, 0);
        group.add(cell);
        cubes.push({ cell, mesh, edges, home, scatter, spin: new THREE.Euler(cell.rotation.x, cell.rotation.y, 0), phase: Math.random() * Math.PI * 2, pop: 0, delay: Math.random() * 0.5 });
      }
    }
  }

  // A few cubes glow acid; clicking reshuffles which ones.
  function paint() {
    const pick = new Set();
    while (pick.size < 5) pick.add(Math.floor(Math.random() * cubes.length));
    cubes.forEach((c, i) => {
      const on = pick.has(i);
      c.mesh.material = on ? acidMat : inkMat;
      c.edges.material = on ? lineInk : lineChalk;
    });
  }
  paint();
  host.addEventListener("click", paint);

  // Hover: the cube under the pointer pops out.
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let hovered = null;
  let tx = 0, ty = 0, mx = 0, my = 0;
  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    tx = ndc.x;
    ty = ndc.y;
  });
  host.addEventListener("pointerleave", () => {
    ndc.set(9, 9);
    tx = 0;
    ty = 0;
  });

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  let start = null;
  loopWhileVisible(host, (t) => {
    if (start === null) start = t;
    const life = t - start;

    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(cubes.map((c) => c.mesh), false);
    hovered = hits.length ? hits[0].object : null;

    cubes.forEach((c) => {
      const a = easeOut(clamp01((life - c.delay) / 1.6));
      const breathe = 1 + Math.sin(t * 1.2 + c.phase) * 0.035;
      const target = c.home.clone().multiplyScalar(breathe);
      c.cell.position.lerpVectors(c.scatter, target, a);
      const isHover = hovered === c.mesh;
      c.pop += ((isHover ? 1 : 0) - c.pop) * 0.15;
      if (c.pop > 0.001) c.cell.position.add(c.home.clone().normalize().multiplyScalar(c.pop * 0.35));
      c.cell.rotation.set(c.spin.x * (1 - a), c.spin.y * (1 - a) + c.pop * 0.6, 0);
    });

    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    group.rotation.y = t * 0.18 + mx * 0.6;
    group.rotation.x = -my * 0.35;
    host.style.cursor = hovered ? "pointer" : "";

    renderer.render(scene, camera);
  });

  host.classList.add("is-live");
}

/* ---------------- Footer terrain ---------------- */

function initTerrain(THREE, host, footer) {
  const renderer = makeRenderer(THREE, host);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(INK, 5, 17);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
  camera.position.set(0, 2.6, 5.2);
  camera.lookAt(0, -0.6, -3);

  const COLS = 90;
  const ROWS = 44;
  const W = 22;
  const D = 12;
  const verts = (COLS + 1) * (ROWS + 1);
  const base = new Float32Array(verts * 3);
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const i = (r * (COLS + 1) + c) * 3;
      base[i] = (c / COLS - 0.5) * W;
      base[i + 1] = 0;
      base[i + 2] = -(r / ROWS) * D + 2;
    }
  }
  const positions = base.slice();
  const index = [];
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const i = r * (COLS + 1) + c;
      if (c < COLS) index.push(i, i + 1);
      if (r < ROWS) index.push(i, i + COLS + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(index);
  const mat = new THREE.LineBasicMaterial({ color: ACID, transparent: true, opacity: 0.75, fog: true });
  scene.add(new THREE.LineSegments(geo, mat));

  // Project the pointer onto the ground so the ripple sits under the mouse.
  const ray = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2(0, 0);
  const hit = new THREE.Vector3(0, 0, -100);
  const target = new THREE.Vector3(0, 0, -100);
  let strength = 0;
  let wanted = 0;

  footer.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(ground, target)) wanted = 1;
  }, { passive: true });
  footer.addEventListener("pointerleave", () => { wanted = 0; });

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  const attr = geo.attributes.position;
  loopWhileVisible(host, (t) => {
    hit.lerp(target, 0.08);
    strength += (wanted - strength) * 0.05;
    for (let i = 0; i < verts; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      let y =
        Math.sin(x * 0.45 + t * 0.6) * Math.cos(z * 0.55 + t * 0.4) * 0.32 +
        Math.sin(x * 0.12 - z * 0.2 + t * 0.25) * 0.4;
      const dx = x - hit.x;
      const dz = z - hit.z;
      const d2 = dx * dx + dz * dz;
      if (strength > 0.001 && d2 < 20) {
        const d = Math.sqrt(d2);
        y += strength * Math.exp(-d2 / 3) * (1.1 + Math.sin(d * 3 - t * 5) * 0.25);
      }
      positions[i * 3 + 1] = y - 0.9;
    }
    attr.needsUpdate = true;
    renderer.render(scene, camera);
  });

  const applyFog = () => scene.fog.color.set(cssColor("--panel", "#121211"));
  applyFog();
  document.addEventListener("themechange", applyFog);

  host.classList.add("is-live");
}

/* ---------------- Boot ---------------- */

async function boot() {
  const no3d = () => document.documentElement.classList.add("no-3d");
  if (reduce.matches || !hasWebGL()) return no3d();
  const globeHost = document.querySelector("[data-globe]");
  const cubesHost = document.querySelector("[data-cubes]");
  const terrainHost = document.querySelector("[data-terrain]");
  const footer = document.querySelector(".footer");
  if (!globeHost && !cubesHost && !terrainHost) return;

  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (e) {
    return no3d(); // No 3D, the page still works.
  }
  const start = async (name, fn) => {
    try {
      await fn();
    } catch (e) {
      console.warn(name + " failed to start", e);
    }
  };
  if (globeHost) start("Globe", () => initGlobe(THREE, globeHost)).then(() => {
    if (!globeHost.classList.contains("is-live")) no3d();
  });
  if (cubesHost) start("Cubes", () => initCubes(THREE, cubesHost));
  if (terrainHost && footer) start("Terrain", () => initTerrain(THREE, terrainHost, footer));
}

boot();
