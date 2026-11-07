/**
 * Foundation VR Tour — vr/vr-tour.js
 * IWSDK-patterned magic-window scene (Three.js, vendored UMD build).
 * This page does NOT import @iwsdk/core and is NOT "built with IWSDK".
 * Patterns borrowed from IWSDK: session entry button, local-floor reference
 * space, gaze/dwell-free tap-to-select, waypoint chips, thumbstick-free
 * orbit fallback. Three modes: VR headset (WebXR where supported),
 * desktop WebGL (drag / wheel / keyboard), mobile touch (drag / tap / pinch).
 * Performance: shared geometries/materials, no textures, no shadow maps,
 * pixelRatio capped (2 desktop, 1.75 mobile), ~40 meshes total.
 */
(function () {
  'use strict';

  var SERIES = [
    ['01', 'Cognition.X', 'S01-cognition-x.html'],
    ['02', 'Empathic.X', 'S02-empathic-x.html'],
    ['03', 'Diagnostic.X', 'S03-diagnostic-x.html'],
    ['04', 'Curable.X', 'S04-curable-x.html'],
    ['05', 'BioPharma.Go', 'S05-biopharma-go.html'],
    ['06', 'Blockchain', 'S06-blockchain.html'],
    ['07', 'Divine DAO', 'S07-divine-dao.html'],
    ['08', 'Locator.X', 'S08-locator-x.html'],
    ['09', 'Astrological.X', 'S09-astrological-x.html'],
    ['10', 'SmartCiti.X', 'S10-smartciti-x.html'],
    ['11', 'Molecular.', 'S11-molecular.html'],
    ['12', 'ParkingSmart.X', 'S12-parking-smart-x.html'],
    ['13', 'Gonstead.X', 'S13-gonstead-x.html'],
    ['14', 'AskDoc.X', 'S14-askdoc-x.html'],
    ['15', 'RomanBridge.DAO', 'S15-romanbridge-dao.html'],
    ['16', 'EchoDawn DAO', 'S16-echodawn-dao.html'],
    ['17', 'Curable.Blockchain DAO', 'S17-curable-blockchain-dao.html'],
    ['18', 'BioDAO.blockchain DAO', 'S18-biodao-blockchain.html'],
    ['19', 'Moscone.X', 'S19-moscone-x.html'],
    ['20', 'CMMC', 'S20-cmmc.html'],
    ['21', 'Incubator DAO', 'S21-incubator-dao.html'],
    ['22', 'Get.Delivery DAO', 'S22-get-delivery-dao.html'],
    ['23', 'Avatar.Chat DAO', 'S23-avatar-chat-dao.html'],
    ['24', 'Donatello DAO', 'S24-donatello-dao.html'],
    ['25', 'Mypet.AI', 'S25-mypet-ai.html'],
    ['26', 'Lyka DAO', 'S26-lyka-dao.html'],
    ['27', 'Genomic DAO', 'S27-genomic-dao.html'],
    ['28', 'Genome.Blockchain', 'S28-genome-blockchain.html'],
    ['29', 'Metaverse DAO', 'S29-metaverse-dao.html'],
    ['30', 'Robotics DAO', 'S30-robotics-dao.html'],
    ['31', 'Aerospace DAO', 'S31-aerospace-dao.html'],
    ['32', 'Solar DAO', 'S32-solar-dao.html'],
    ['33', 'InfoGurus', 'S33-infogurus.html']
  ];

  var STEPS = {
    1: {
      title: 'Step 1 — See the mission',
      body: 'The Foundation exists for safe, equitable, socially beneficial AI. The gold beacon at the centre is the mission: replace the incentive for conflict with a mechanism for shared prosperity — the Fiduciary Shield, Open Global Investment, and the Windfall Clause, working as one system.',
      az: 0.6, el: 0.35, dist: 14, lookY: 1.2
    },
    2: {
      title: 'Step 2 — Explore the 33 proposed series',
      body: 'The teal ring holds 33 orbs — one for each proposed W3 series, from Diagnostic.X to Robotics DAO to InfoGurus. Tap or click an orb to see its name and open its page. These series are proposed, not formed, funded, or offered.',
      az: 2.4, el: 0.55, dist: 15, lookY: 0.8
    },
    3: {
      title: 'Step 3 — Support the mission',
      body: 'The Foundation takes donations and grants only, in its own account, for charitable purposes. No donation is tax-deductible (no IRS 501(c)(3) determination letter is in the files), and no donation buys a seat, a vote, or a share. Nothing here is an offering of securities.',
      az: 4.4, el: 0.3, dist: 13, lookY: 1.0
    }
  };

  var canvas = document.getElementById('vr-canvas');
  var fallback = document.getElementById('webgl-fallback');
  var guideTitle = document.getElementById('guide-title');
  var guideBody = document.getElementById('guide-body');
  var seriesName = document.getElementById('series-name');
  var seriesLink = document.getElementById('series-link');
  var statusLine = document.getElementById('vr-status');
  var xrBtn = document.getElementById('enter-vr');
  var stepBtns = document.querySelectorAll('[data-step]');

  /* ---- UI controls (VR fix 2026-11-07): every panel gets close (×),
     minimise (–, collapsed header bar), and size cycle (⤢ S/M/L);
     a global Hide-UI toggle (button + H key) hides all panels at once
     for a clear view, leaving a minimal restore bar visible.
     Works on the DOM panels only — in an immersive-VR session the
     browser does not render these DOM panels, so nothing changes there.
     Existing tour behaviour (steps, chips, orbs, XR) is untouched. ---- */
  var SIZES = ['ui-size-s', 'ui-size-m', 'ui-size-l'];
  var hideAllBtn = document.getElementById('ui-hide-all');
  var restoreBar = document.getElementById('ui-restore-bar');
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-ui-panel]'));
  function panelLabel(p) { return p.getAttribute('data-panel-label') || p.id || 'Panel'; }
  function syncRestoreBar() {
    if (!restoreBar) return;
    var closed = panels.filter(function (p) { return p.classList.contains('is-hidden'); });
    var allHidden = document.body.classList.contains('ui-all-hidden');
    restoreBar.innerHTML = '';
    if (!closed.length && !allHidden) { restoreBar.hidden = true; return; }
    restoreBar.hidden = false;
    if (allHidden) {
      var showAll = document.createElement('button');
      showAll.type = 'button'; showAll.className = 'restore-all';
      showAll.textContent = 'Show all panels';
      showAll.addEventListener('click', showAllPanels);
      restoreBar.appendChild(showAll);
    }
    closed.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = 'Show: ' + panelLabel(p);
      b.addEventListener('click', function () { showPanel(p); });
      restoreBar.appendChild(b);
    });
  }
  function closePanel(p) {
    p.classList.add('is-hidden'); p.hidden = true; syncRestoreBar();
  }
  function showPanel(p) {
    p.classList.remove('is-hidden'); p.classList.remove('is-collapsed');
    p.hidden = false; // an explicit Show always unhides, whatever hid it before
    var minBtn = p.querySelector('[data-ui-min]');
    if (minBtn) minBtn.textContent = '–';
    syncRestoreBar();
  }
  function showAllPanels() {
    document.body.classList.remove('ui-all-hidden');
    if (hideAllBtn) { hideAllBtn.textContent = '👁 Hide UI (H)'; hideAllBtn.setAttribute('aria-pressed', 'false'); }
    panels.forEach(function (p) { if (p.classList.contains('is-hidden')) showPanel(p); });
    syncRestoreBar();
  }
  function hideAllPanels() {
    document.body.classList.add('ui-all-hidden');
    if (hideAllBtn) { hideAllBtn.textContent = '👁 Show UI (H)'; hideAllBtn.setAttribute('aria-pressed', 'true'); }
    syncRestoreBar();
  }
  panels.forEach(function (p) {
    var sizeBtn = p.querySelector('[data-ui-size]');
    if (sizeBtn) sizeBtn.addEventListener('click', function () {
      var cur = SIZES.findIndex(function (s) { return p.classList.contains(s); });
      SIZES.forEach(function (s) { p.classList.remove(s); });
      p.classList.add(SIZES[(cur + 1) % SIZES.length]);
    });
    var minBtn = p.querySelector('[data-ui-min]');
    if (minBtn) minBtn.addEventListener('click', function () {
      var collapsed = p.classList.toggle('is-collapsed');
      minBtn.textContent = collapsed ? '+' : '–';
      minBtn.setAttribute('aria-label', (collapsed ? 'Expand ' : 'Minimise ') + panelLabel(p) + ' panel');
    });
    var closeBtn = p.querySelector('[data-ui-close]');
    if (closeBtn) closeBtn.addEventListener('click', function () { closePanel(p); });
  });
  if (hideAllBtn) hideAllBtn.addEventListener('click', function () {
    if (document.body.classList.contains('ui-all-hidden')) showAllPanels(); else hideAllPanels();
  });
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'h' || e.key === 'H') {
      if (document.body.classList.contains('ui-all-hidden')) showAllPanels(); else hideAllPanels();
    }
  });
  syncRestoreBar();

  function setStep(n) {
    var s = STEPS[n];
    if (!s) return;
    guideTitle.textContent = s.title;
    guideBody.textContent = s.body;
    stepBtns.forEach(function (b) {
      var on = b.getAttribute('data-step') === String(n);
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (typeof goTo === 'function' && typeof target !== 'undefined') goTo(s.az, s.el, s.dist, s.lookY);
  }

  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () { setStep(Number(b.getAttribute('data-step'))); });
  });

  // Build the tap/click series chip list (also the no-WebGL path uses the
  // static list in the fallback block, so this is progressive enhancement).
  var chipWrap = document.getElementById('series-chips');
  SERIES.forEach(function (s) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = 'S' + s[0] + ' · ' + s[1];
    b.addEventListener('click', function () { selectSeries(s, true); });
    chipWrap.appendChild(b);
  });

  function selectSeries(s, fromChip) {
    seriesName.textContent = 'S' + s[0] + ' — ' + s[1] + ' (proposed series)';
    seriesLink.href = '../series/' + s[2];
    seriesLink.textContent = 'Open the ' + s[1] + ' series page →';
    seriesLink.hidden = false;
    if (fromChip && typeof focusOrb === 'function' && typeof orbs !== 'undefined') focusOrb(Number(s[0]));
  }

  // ---- WebGL availability: honest fallback, full 2D tour still works ----
  var glOK = false;
  try {
    var t = document.createElement('canvas');
    glOK = !!(t.getContext('webgl2') || t.getContext('webgl'));
  } catch (e) { glOK = false; }

  if (!glOK || typeof THREE === 'undefined') {
    canvas.hidden = true;
    fallback.hidden = false;
    statusLine.textContent = typeof THREE === 'undefined'
      ? '3D library did not load — showing the full 2D guided tour instead. All three steps and all 33 series links work below.'
      : 'WebGL is not available in this browser — showing the full 2D guided tour instead. All three steps and all 33 series links work below.';
    setStep(1);
    xrBtn.disabled = true;
    xrBtn.textContent = 'Enter VR — unavailable (no WebGL / no headset)';
    return;
  }

  // ---- Three.js scene (magic window) ----
  var isMobile = window.matchMedia('(pointer: coarse)').matches ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  var container = document.getElementById('vr-stage');

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  } catch (e) {
    canvas.hidden = true;
    fallback.hidden = false;
    statusLine.textContent = 'WebGL could not start in this browser — showing the full 2D guided tour instead.';
    setStep(1);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2));
  renderer.xr.enabled = true; // IWSDK-patterned session entry; no @iwsdk import.

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1e3a);
  scene.fog = new THREE.Fog(0x0b1e3a, 18, 42);

  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(6, 10, 4);
  scene.add(key);
  var rim = new THREE.PointLight(0xc9a227, 1.2, 30);
  rim.position.set(0, 4, 0);
  scene.add(rim);

  // Shared materials / geometries: one draw call per mesh, ~40 meshes total.
  var goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, emissive: 0x6b5510, metalness: 0.6, roughness: 0.35 });
  var tealMat = new THREE.MeshStandardMaterial({ color: 0x0e7c7b, emissive: 0x063f3e, metalness: 0.3, roughness: 0.5 });
  var tealBright = new THREE.MeshStandardMaterial({ color: 0x6fd3c1, emissive: 0x1d6b60, metalness: 0.2, roughness: 0.4 });
  var navyMat = new THREE.MeshStandardMaterial({ color: 0x123a6b, emissive: 0x0a1f38, metalness: 0.2, roughness: 0.6 });
  var whiteMat = new THREE.MeshStandardMaterial({ color: 0xf6f7f9, emissive: 0x555555, metalness: 0.1, roughness: 0.5 });
  var floorMat = new THREE.MeshStandardMaterial({ color: 0x10294d, metalness: 0.1, roughness: 0.9 });

  var orbGeo = new THREE.SphereGeometry(0.28, 20, 14);
  var beaconGeo = new THREE.IcosahedronGeometry(1.4, 0);
  var pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.2, 12);
  var ringGeo = new THREE.TorusGeometry(6, 0.06, 8, 64);

  // Floor disc + guide ring.
  var floor = new THREE.Mesh(new THREE.CircleGeometry(11, 48), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  var ring = new THREE.Mesh(ringGeo, tealBright);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  scene.add(ring);

  // Centre beacon — the mission.
  var beacon = new THREE.Mesh(beaconGeo, goldMat);
  beacon.position.y = 2.2;
  scene.add(beacon);
  var beaconCore = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), whiteMat);
  beaconCore.position.y = 2.2;
  scene.add(beaconCore);

  // Three guide gates: Mission (gold), Series (teal), Support (white).
  function gate(angle, mat, label) {
    var g = new THREE.Group();
    var p1 = new THREE.Mesh(pillarGeo, mat); p1.position.set(-1.1, 1.6, 0);
    var p2 = new THREE.Mesh(pillarGeo, mat); p2.position.set(1.1, 1.6, 0);
    var top = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.35, 0.35), mat);
    top.position.y = 3.3;
    g.add(p1); g.add(p2); g.add(top);
    g.position.set(Math.sin(angle) * 9.5, 0, Math.cos(angle) * 9.5);
    g.lookAt(0, 0, 0);
    g.userData.label = label;
    scene.add(g);
    return g;
  }
  gate(0.6, goldMat, 'Mission');
  gate(2.4, tealMat, 'Series');
  gate(4.4, whiteMat, 'Support');

  // Steward Guide — a simple illustrated guide figure, not a real person.
  var guide = new THREE.Group();
  var gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 1.5, 16), navyMat);
  gBody.position.y = 0.75;
  var gHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), goldMat);
  gHead.position.y = 1.85;
  var gVisor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), tealBright);
  gVisor.position.set(0, 1.88, 0.3);
  guide.add(gBody); guide.add(gHead); guide.add(gVisor);
  guide.position.set(2.6, 0, 4.2);
  guide.lookAt(0, 1.2, 0);
  scene.add(guide);

  // 33 series orbs on the ring.
  var orbs = [];
  SERIES.forEach(function (s, i) {
    var a = (i / SERIES.length) * Math.PI * 2;
    var orb = new THREE.Mesh(orbGeo, tealMat);
    orb.position.set(Math.sin(a) * 6, 0.9, Math.cos(a) * 6);
    orb.userData.series = s;
    orb.userData.baseY = 0.9;
    orb.userData.phase = i * 0.35;
    scene.add(orb);
    orbs.push(orb);
  });
  var selectedOrb = null;

  // ---- Orbit state: drag / touch / wheel / pinch / keyboard ----
  var target = { az: 0.6, el: 0.35, dist: 14, lookY: 1.2 };
  var current = { az: 0.6, el: 0.35, dist: 14, lookY: 1.2 };
  function goTo(az, el, dist, lookY) {
    target.az = az; target.el = el; target.dist = dist; target.lookY = lookY;
  }
  function focusOrb(num) {
    var orb = orbs[num - 1];
    if (!orb) return;
    var a = Math.atan2(orb.position.x, orb.position.z);
    goTo(a, 0.45, 9, 0.9);
    highlightOrb(orb);
  }
  function highlightOrb(orb) {
    if (selectedOrb) { selectedOrb.material = tealMat; selectedOrb.scale.set(1, 1, 1); }
    selectedOrb = orb;
    orb.material = goldMat;
    orb.scale.set(1.6, 1.6, 1.6);
    selectSeries(orb.userData.series, false);
  }

  function applyCamera() {
    current.az += (target.az - current.az) * 0.06;
    current.el += (target.el - current.el) * 0.06;
    current.dist += (target.dist - current.dist) * 0.06;
    current.lookY += (target.lookY - current.lookY) * 0.06;
    camera.position.set(
      Math.sin(current.az) * Math.cos(current.el) * current.dist,
      Math.sin(current.el) * current.dist + 0.6,
      Math.cos(current.az) * Math.cos(current.el) * current.dist
    );
    camera.lookAt(0, current.lookY, 0);
  }

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  function pick(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(orbs, false);
    if (hits.length) highlightOrb(hits[0].object);
  }

  var dragging = false, lastX = 0, lastY = 0, moved = 0;
  var pinchDist = 0;
  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX; lastY = e.clientY;
    target.az -= dx * 0.005;
    target.el = Math.max(-0.1, Math.min(1.2, target.el + dy * 0.003));
  });
  canvas.addEventListener('pointerup', function (e) {
    dragging = false;
    if (moved < 8) pick(e.clientX, e.clientY); // tap = select, drag = orbit
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    target.dist = Math.max(7, Math.min(22, target.dist + e.deltaY * 0.01));
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                         e.touches[0].clientY - e.touches[1].clientY);
      if (pinchDist > 0) target.dist = Math.max(7, Math.min(22, target.dist - (d - pinchDist) * 0.02));
      pinchDist = d;
    }
  }, { passive: true });
  canvas.addEventListener('touchend', function () { pinchDist = 0; });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') target.az += 0.12;
    else if (e.key === 'ArrowRight') target.az -= 0.12;
    else if (e.key === 'ArrowUp') target.el = Math.min(1.2, target.el + 0.08);
    else if (e.key === 'ArrowDown') target.el = Math.max(-0.1, target.el - 0.08);
    else if (e.key === '1') setStep(1);
    else if (e.key === '2') setStep(2);
    else if (e.key === '3') setStep(3);
  });

  function resize() {
    var w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- WebXR entry (IWSDK-patterned; honest capability check) ----
  var xrSession = null;
  function xrNote(msg) { statusLine.textContent = msg; }
  if ('xr' in navigator && navigator.xr && navigator.xr.isSessionSupported) {
    navigator.xr.isSessionSupported('immersive-vr').then(function (ok) {
      if (ok) {
        xrBtn.disabled = false;
        xrBtn.textContent = 'Enter VR — headset detected';
        xrNote('Headset support detected in this browser. Desktop and mobile visitors use the drag / tap tour below — same three steps, no headset needed.');
      } else {
        xrBtn.disabled = true;
        xrBtn.textContent = 'Enter VR — no headset detected in this browser';
        xrNote('No VR headset detected in this browser. The full tour works here with drag / tap — same three steps, no headset needed.');
      }
    }).catch(function () {
      xrBtn.disabled = true;
      xrBtn.textContent = 'Enter VR — unavailable in this browser';
    });
  } else {
    xrBtn.disabled = true;
    xrBtn.textContent = 'Enter VR — WebXR not available in this browser';
    xrNote('This browser does not offer WebXR. The full tour works here with drag / tap — same three steps, no headset needed.');
  }
  xrBtn.addEventListener('click', function () {
    if (xrSession) { xrSession.end(); return; }
    navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] })
      .then(function (session) {
        xrSession = session;
        xrBtn.textContent = 'Exit VR';
        renderer.xr.setReferenceSpaceType('local-floor');
        renderer.xr.setSession(session);
        session.addEventListener('end', function () {
          xrSession = null;
          xrBtn.textContent = 'Enter VR — headset detected';
        });
      })
      .catch(function () { xrNote('The headset session could not start. The drag / tap tour below still works.'); });
  });

  // ---- Render loop ----
  var clock = new THREE.Clock();
  function animate() {
    var t = clock.getElapsedTime();
    beacon.rotation.y = t * 0.25;
    beacon.rotation.x = Math.sin(t * 0.3) * 0.15;
    beacon.position.y = 2.2 + Math.sin(t * 0.8) * 0.12;
    guide.position.y = Math.sin(t * 1.1) * 0.06;
    orbs.forEach(function (o) {
      o.position.y = o.userData.baseY + Math.sin(t * 1.2 + o.userData.phase) * 0.08;
    });
    applyCamera();
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);

  setStep(1);
  if (!statusLine.textContent) {
    statusLine.textContent = isMobile
      ? 'Mobile mode: drag to look around, tap an orb to open a series, pinch to zoom. Buttons below do the same — no headset needed.'
      : 'Desktop mode: drag to look around, scroll to zoom, arrow keys work too. Click an orb to open a series — or use the buttons below.';
  }
})();
