/* 3D scenes: dotted globe in the hero, wireframe terrain in the footer.
   Loaded as a module; Three.js is only downloaded on desktop screens
   with WebGL and without reduced motion. */

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const INK = 0x121211;
const ACID = 0xc8ff00;

const wide = window.matchMedia("(min-width: 900px)");
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

function initGlobe(THREE, host) {
  const renderer = makeRenderer(THREE, host);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 4.2);

  const globe = new THREE.Group();
  scene.add(globe);

  // Invisible sphere that hides the pin when it turns to the back.
  const occluder = new THREE.Mesh(
    new THREE.SphereGeometry(0.985, 48, 48),
    new THREE.MeshBasicMaterial({ colorWrite: false })
  );
  occluder.renderOrder = -1;
  globe.add(occluder);

  // Fibonacci-distributed dots; size follows the light like a dither.
  const COUNT = 5200;
  const pos = new Float32Array(COUNT * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    pos[i * 3] = Math.cos(th) * rad;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(th) * rad;
  }
  const dotsGeo = new THREE.BufferGeometry();
  dotsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  const dotsMat = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(INK) },
      uLight: { value: new THREE.Vector3(-0.6, 0.7, 0.9).normalize() },
      uSize: { value: 3.2 },
      uRatio: { value: renderer.getPixelRatio() }
    },
    vertexShader: `
      uniform vec3 uLight;
      uniform float uSize;
      uniform float uRatio;
      varying float vLight;
      varying float vFront;
      void main() {
        vec3 n = normalize(mat3(modelMatrix) * position);
        vLight = max(dot(n, uLight), 0.0);
        vFront = n.z;
        vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uRatio * (0.25 + vLight * 1.1) * (4.2 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vLight;
      varying float vFront;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (dot(c, c) > 0.25) discard;
        float a = vFront > 0.0 ? 0.28 + vLight * 0.42 : 0.07;
        gl_FragColor = vec4(uColor, a);
      }
    `
  });
  globe.add(new THREE.Points(dotsGeo, dotsMat));

  // Thin outline so the sphere reads as a solid form.
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 129 }, (_, i) => {
        const a = (i / 128) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 1.002, Math.sin(a) * 1.002, 0);
      })
    ),
    new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.18 })
  );
  scene.add(ring);

  // Tagum City pin: ink halo, acid core, pulsing acid ring.
  const TAGUM = { lat: 7.45, lon: 125.81 };
  const pinPos = latLonToVec(THREE, TAGUM.lat, TAGUM.lon, 1.01);

  const pinGeo = new THREE.BufferGeometry().setFromPoints([pinPos]);
  const pinMat = (color, size) =>
    new THREE.PointsMaterial({ color, size: size * renderer.getPixelRatio(), sizeAttenuation: false, depthTest: true });
  const halo = new THREE.Points(pinGeo, pinMat(INK, 15));
  const core = new THREE.Points(pinGeo, pinMat(ACID, 9));
  core.renderOrder = 2;
  globe.add(halo, core);

  const pulse = new THREE.Mesh(
    new THREE.RingGeometry(0.03, 0.042, 48),
    new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthTest: true })
  );
  pulse.position.copy(pinPos);
  pulse.lookAt(pinPos.clone().multiplyScalar(2));
  globe.add(pulse);

  // Face the Philippines, tilt a little, follow the mouse gently.
  const baseY = -(TAGUM.lon * Math.PI) / 180;
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  loopWhileVisible(host, (t) => {
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    globe.rotation.y = baseY + Math.sin(t * 0.12) * 0.7 + mx * 0.5;
    globe.rotation.x = 0.18 + my * 0.25;
    const p = (t * 0.6) % 1;
    pulse.scale.setScalar(1 + p * 2.2);
    pulse.material.opacity = 0.6 * (1 - p);
    renderer.render(scene, camera);
  });

  host.classList.add("is-live");
}

/* ---------------- Footer terrain ---------------- */

function initTerrain(THREE, host, footer) {
  const renderer = makeRenderer(THREE, host);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(INK, 4, 13);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
  camera.position.set(0, 2.1, 5.4);
  camera.lookAt(0, -0.2, -2.5);

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
  const mat = new THREE.LineBasicMaterial({ color: ACID, transparent: true, opacity: 0.42, fog: true });
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

  host.classList.add("is-live");
}

/* ---------------- Boot ---------------- */

async function boot() {
  if (!wide.matches || reduce.matches || !hasWebGL()) return;
  const globeHost = document.querySelector("[data-globe]");
  const terrainHost = document.querySelector("[data-terrain]");
  const footer = document.querySelector(".footer");
  if (!globeHost && !terrainHost) return;

  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (e) {
    return; // No 3D, the page still works.
  }
  try {
    if (globeHost) initGlobe(THREE, globeHost);
  } catch (e) {
    console.warn("Globe failed to start", e);
  }
  try {
    if (terrainHost && footer) initTerrain(THREE, terrainHost, footer);
  } catch (e) {
    console.warn("Terrain failed to start", e);
  }
}

boot();
