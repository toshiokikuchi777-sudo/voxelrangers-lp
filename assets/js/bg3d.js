// V-RANGERS LP — Background 3D voxel scene (Three.js, ES module CDN)
// Fixed-position canvas behind content. Cubes rotate continuously and parallax with scroll.

import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

(() => {
  const canvas = document.getElementById('bg3d');
  if (!canvas) return;

  // Respect reduced-motion preference: still render scene but disable scroll/rotation animation
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07021a, 0.04);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 14);

  // Lights — match brand palette
  scene.add(new THREE.AmbientLight(0x4a2a6e, 0.6));
  const magentaLight = new THREE.DirectionalLight(0xff2dcb, 1.4);
  magentaLight.position.set(5, 4, 6);
  scene.add(magentaLight);
  const cyanLight = new THREE.PointLight(0x36f0ff, 2.2, 40);
  cyanLight.position.set(-6, -2, 4);
  scene.add(cyanLight);
  const purpleLight = new THREE.PointLight(0x9d4edd, 1.6, 35);
  purpleLight.position.set(4, -4, -3);
  scene.add(purpleLight);

  // Voxel-style faceted cubes
  const palette = [
    { color: 0xff2dcb, emissive: 0x4a0a3a },
    { color: 0x36f0ff, emissive: 0x0a3a4a },
    { color: 0x9d4edd, emissive: 0x2a0a4a },
    { color: 0xff7bdb, emissive: 0x4a1a3a },
    { color: 0xffffff, emissive: 0x111122 }
  ];

  const cubes = [];
  const COUNT = 14;

  const rand = (min, max) => Math.random() * (max - min) + min;

  for (let i = 0; i < COUNT; i++) {
    const size = rand(0.55, 1.4);
    const geom = new THREE.BoxGeometry(size, size, size);
    const c = palette[i % palette.length];
    const mat = new THREE.MeshStandardMaterial({
      color: c.color,
      emissive: c.emissive,
      emissiveIntensity: 0.35,
      metalness: 0.35,
      roughness: 0.55,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geom, mat);

    // Random distribution in a wide horizontal band
    mesh.position.set(rand(-12, 12), rand(-8, 8), rand(-10, 4));
    mesh.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));

    // Subtle wireframe overlay for the voxel feel
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: 0.35
      })
    );
    mesh.add(edges);

    scene.add(mesh);
    cubes.push({
      mesh,
      baseY: mesh.position.y,
      rotSpeed: { x: rand(-0.003, 0.003), y: rand(-0.005, 0.005), z: rand(-0.002, 0.002) },
      parallax: rand(0.0008, 0.0035),
      drift: rand(0, Math.PI * 2)
    });
  }

  // Scroll state
  let targetScroll = window.scrollY;
  let smoothScroll = targetScroll;
  window.addEventListener('scroll', () => {
    targetScroll = window.scrollY;
  }, { passive: true });

  // Resize
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', onResize);

  // Pause when offscreen / tab hidden to save power
  let isVisible = true;
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
  });

  // Animate
  let lastTime = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (!isVisible) return;

    const dt = Math.min((now - lastTime) / 16.6667, 2);
    lastTime = now;

    smoothScroll += (targetScroll - smoothScroll) * 0.08;
    const t = now * 0.0006;

    cubes.forEach((c) => {
      if (!reduce) {
        c.mesh.rotation.x += c.rotSpeed.x * dt;
        c.mesh.rotation.y += c.rotSpeed.y * dt;
        c.mesh.rotation.z += c.rotSpeed.z * dt;
      }
      // parallax + gentle floating
      const floatY = Math.sin(t + c.drift) * 0.4;
      c.mesh.position.y = c.baseY - smoothScroll * c.parallax + floatY;
    });

    // Slight camera drift for parallax depth
    camera.position.x = Math.sin(t * 0.3) * 0.6;
    camera.position.y = -smoothScroll * 0.0008;
    camera.lookAt(0, camera.position.y, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
