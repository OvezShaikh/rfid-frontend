import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import * as THREE from 'three';
import gsap from 'gsap';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import MopedOutlinedIcon from '@mui/icons-material/MopedOutlined';

const CAM_D = 11;
const HALF_H = Math.tan((15 * Math.PI) / 180) * CAM_D;
const ACCENT = '#5cc8ff';
const ON_ACCENT = '#03121c';
const FONT = '"DM Sans", sans-serif';

// Blue-only backgrounds (one per vehicle, both blue)
const THEMES = {
  motorcycle: { '--pk-inner': '#12568a', '--pk-mid': '#0a2f4d', '--pk-outer': '#030d16' },
  scooter:    { '--pk-inner': '#0f6fa8', '--pk-mid': '#0a3a5e', '--pk-outer': '#04121f' },
};
// Dimensions & insert colours come from your two Three.js files
const SPEC = {
  motorcycle: { sleeve: 1045, ins: [0, 0, 0] },
  scooter:    { sleeve: 1610, ins: [0, 1, 1] },
};
// [x (−1..1 of half-width), y (−1..1 of half-height), z, type, scale, insertSlot]
const HOMES = [
  [-0.28, 0.55, 1, 'lid', 0.5], [-0.25, -0.55, 2.5, 'ins', 0.42, 0],
  [0.27, 0.6, 0.5, 'sleeve', 0.42], [0.3, -0.5, 1.5, 'pallet', 0.5],
  [-0.38, 0.05, -1.5, 'sep', 0.6], [0.38, 0.1, -1, 'ins', 0.36, 1],
  [0.1, 0.88, -2, 'ins', 0.4, 1], [-0.12, -0.88, -2, 'sep', 0.5],
];


const CARDS = [
  { id: 'motorcycle', label: 'Motorcycle', sub: 'Sleeve 1045 mm', Icon: TwoWheelerOutlinedIcon },
  { id: 'scooter',    label: 'Scooter',    sub: 'Sleeve 1610 mm', Icon: MopedOutlinedIcon },
];

export default function PackagingHero({
  height = 520,
  title = ['Zero', 'Damage'],
  sideTitle = ['Stacked', 'Right'],
  description = 'Pallet, sleeve, PP inserts, separators and lid — one engineered system for every motorcycle and scooter shipment.',
  sx,
}) {
  const rootRef = useRef(null);
  const hostRef = useRef(null);
  const dotsRef = useRef(null);
  const api = useRef({});
  const mouse = useRef({ nx: 0, ny: 0, on: false });
  const [flavor, setFlavor] = useState('motorcycle');
  const [assembled, setAssembled] = useState(false);
  const [compact, setCompact] = useState(false);

  const trackPointer = (e) => {
    const r = rootRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    mouse.current = { nx: ((p.clientX - r.left) / r.width) * 2 - 1, ny: -(((p.clientY - r.top) / r.height) * 2 - 1), on: true };
  };

  useEffect(() => {
    const root = rootRef.current, host = hostRef.current, dots = dotsRef.current;
    const ctx = gsap.context(() => {}, root);
    const alive = { v: true, visible: true };

    /* ---------- renderer / scene ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const PI = Math.PI; // light intensities are scaled for three r155+
    scene.add(new THREE.AmbientLight(0xffffff, 0.8 * PI));
    const key = new THREE.DirectionalLight(0xffffff, 0.9 * PI); key.position.set(4, 8, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fd8ff, 0.7 * PI); rim.position.set(-5, 2, -5); scene.add(rim);

    /* ---------- materials ---------- */
    const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
    const mBlack = M(0x1f2430), mSep = M(0x00a3ff, { roughness: 0.5 });
    const mSleeve = M(0x8a93a3, { transparent: true, opacity: 0.8 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    const grid = (bg, ln) => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 256, 256); x.strokeStyle = ln; x.lineWidth = 8;
      for (let i = 0; i <= 256; i += 42) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
      const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
    };
    const TEX = { blue: grid('#1a6aa3', '#0a3658'), green: grid('#48d597', '#2e8c62'), grey: grid('#888c93', '#5c626b') };
    const SIDE = { blue: 0x1a6aa3, green: 0x48d597, grey: 0x888c93 };
    const insSide = [M(0x1a6aa3), M(0x1a6aa3)];
    const insTop = [M(0xffffff, { map: TEX.blue }), M(0xffffff, { map: TEX.blue })];
    const skin = (v) => (v === 'scooter' ? ['green', 'grey'] : ['blue', 'blue']).forEach((k, i) => {
      insSide[i].color.set(SIDE[k]); insTop[i].map = TEX[k]; insTop[i].needsUpdate = true;
    });
    const box = (w, h, d, m, t) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, t ? [m, m, t, m, m, m] : m);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
      return mesh;
    };
    const buildPallet = () => {
      const g = new THREE.Group(); g.add(box(1200, 40, 1000, mBlack));
      for (const x of [-500, 0, 500]) for (const z of [-400, 0, 400]) { const f = box(120, 110, 120, mBlack); f.position.set(x, -75, z); g.add(f); }
      return g;
    };

    /* ---------- hero: container assembly (mm → scene units) ---------- */
    const hero = new THREE.Group(); hero.scale.setScalar(0.001); scene.add(hero);
    let cont = null, isAssembled = false;
    const buildContainer = (v) => {
      const sp = SPEC[v], g = new THREE.Group(), parts = [];
      const pal = buildPallet(); pal.position.y = 130; g.add(pal);
      const sl = box(1165, sp.sleeve, 965, mSleeve); sl.position.y = 150 + sp.sleeve / 2; g.add(sl);
      let y = 150 + sp.sleeve + 100, as = 150;
      [['sep'], ['ins', 0], ['sep'], ['ins', 1], ['sep'], ['ins', 2], ['lid']].forEach(([t, k]) => {
        let m, h;
        if (t === 'sep') { h = 5; m = box(1160, h, 960, mSep); }
        if (t === 'ins') { h = 515; const i = sp.ins[k]; m = box(1160, h, 960, insSide[i], insTop[i]); }
        if (t === 'lid') { h = 60; m = box(1200, h, 1000, mBlack); }
        m.position.y = y + h / 2; m.userData = { exY: y + h / 2, asY: as + h / 2 };
        g.add(m); parts.push(m); y += h + 130; as += h;
      });
      g.position.y = -(y - 130) / 2;
      const wrap = new THREE.Group(); wrap.add(g);
      return { wrap, parts };
    };
    const setContainer = (v) => {
      if (cont) { hero.remove(cont.wrap); cont.wrap.traverse((o) => o.geometry && o.geometry.dispose()); }
      cont = buildContainer(v); hero.add(cont.wrap); isAssembled = false; setAssembled(false);
    };

    /* ---------- floating parts ---------- */
    const floaters = HOMES.map(([nx, ny, z, t, s, i]) => {
      let o;
      if (t === 'lid') o = box(1200, 60, 1000, mBlack);
      else if (t === 'ins') o = box(1160, 515, 960, insSide[i], insTop[i]);
      else if (t === 'sep') o = box(1160, 30, 960, mSep);
      else if (t === 'sleeve') o = box(1165, 600, 965, mSleeve);
      else o = buildPallet();
      const w = new THREE.Group(); w.add(o); w.rotation.set(Math.random() * 6, Math.random() * 6, 0); scene.add(w);
      return { w, n: [nx, ny, z], home: new THREE.Vector3(), base: new THREE.Vector3(), s: s * 0.001, k: 1, pull: 0, rx: 0, ry: 0 };
    });
    skin('motorcycle'); setContainer('motorcycle');

    /* ---------- sizing (follows the card, not the window) ---------- */
    let W = 1, H = 1, hh = HALF_H, halfW = HALF_H;
    let switching = false, spin = 0, current = 'motorcycle';
    const fit = () => {
      W = host.clientWidth || 1; H = host.clientHeight || 1;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      const sc = Math.max(1, 1.3 / camera.aspect);
      camera.position.set(0, 0, CAM_D * sc); camera.updateProjectionMatrix();
      hh = HALF_H * sc; halfW = hh * camera.aspect;
      floaters.forEach((f) => { f.home.set(f.n[0] * halfW, f.n[1] * hh, f.n[2]); if (!switching) f.base.copy(f.home); });
      setCompact(W < 760);
    };
    const ro = new ResizeObserver(fit); ro.observe(host); fit();
    const io = new IntersectionObserver(([e]) => { alive.visible = e.isIntersecting; }); io.observe(root);

    /* ---------- actions exposed to the UI ---------- */
    api.current.toggleAssembly = () => {
      if (switching) return;
      isAssembled = !isAssembled; setAssembled(isAssembled);
      const n = cont.parts.length;
      cont.parts.forEach((m, i) => gsap.to(m.position, {
        y: isAssembled ? m.userData.asY : m.userData.exY, duration: 2, ease: 'power3.inOut',
        delay: (isAssembled ? i : n - 1 - i) * 0.15, overwrite: true,
      }));
    };
    api.current.switchFlavor = (next) => ctx.add(() => {
      if (switching || next === current) return;
      switching = true; setFlavor(next);
      gsap.to(root, { ...THEMES[next], duration: 1.5, ease: 'power2.inOut' });
      const s = { v: 0, blur: 0 };
      const apply = () => { spin = s.v; host.style.filter = `blur(${s.blur}px)`; };
      gsap.to(s, { v: PI * 2, blur: 12, duration: 0.6, ease: 'power2.in', onUpdate: apply, onComplete: () => {
        current = next; skin(next); setContainer(next); // swap at the peak of the spin
        gsap.to(s, { v: PI * 4, blur: 0, duration: 1.5, ease: 'back.out(0.7)', onUpdate: apply,
          onComplete: () => { spin = 0; host.style.filter = 'none'; } });
      } });
      let done = 0;
      floaters.forEach((f) => gsap.timeline()
        .to(f, { pull: 1, k: 0.1, duration: 0.5, ease: 'power2.in' })
        .to(f, { duration: 0.3 })
        .to(f, { pull: 0, k: 1, duration: 0.9, ease: 'back.out(1.5)',
          onStart: () => { f.base.set(f.home.x + (Math.random() - 0.5) * 1.2, f.home.y + (Math.random() - 0.5) * 1.2, f.home.z); f.rx = f.ry = 0; },
          onComplete: () => { if (++done === floaters.length) switching = false; } }));
    });

    /* ---------- render loop ---------- */
    const cur = { x: 0, y: 0 };
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!alive.visible || document.hidden) return;
      const t = performance.now() * 0.001, m = mouse.current;
      cur.x += (m.nx / 2 - cur.x) * 0.05; cur.y += (-m.ny / 2 - cur.y) * 0.05;

      hero.rotation.y = -0.55 + cur.x * 0.7 + spin;
      hero.rotation.x = 0.15 + cur.y * 0.35;
      hero.position.y = Math.sin((t * PI * 2) / 6) * 0.12;

      const ppw = (2 * hh) / H, mx = m.nx * halfW, my = m.ny * hh, R = 220 * ppw;
      floaters.forEach((f, i) => {
        let tx = 0, ty = 0, speed = 1;
        if (!switching && m.on) {
          const dx = f.base.x - mx, dy = f.base.y - my, d = Math.hypot(dx, dy) || 1;
          if (d < R) { const force = (R - d) / R; tx = (dx / d) * force * 60 * ppw; ty = (dy / d) * force * 60 * ppw; speed = 1 + force * 5; }
        }
        f.rx += (tx - f.rx) * 0.1; f.ry += (ty - f.ry) * 0.1;
        const dur = [5, 7, 6, 8, 5.5, 6.5, 9, 11][i % 8], ph = (t + i * 0.7) * ((PI * 2) / dur), depth = (f.base.z + 2) / 3;
        const px = f.base.x + f.rx + cur.x * 0.5 * depth, py = f.base.y + f.ry + Math.sin(ph) * 0.15 - cur.y * 0.5 * depth;
        f.w.position.set(px * (1 - f.pull), py * (1 - f.pull), f.base.z * (1 - f.pull));
        f.w.scale.setScalar(f.s * f.k);
        f.w.rotation.y += 0.006 * speed; f.w.rotation.x += 0.003 * speed;
      });
      renderer.render(scene, camera);
    };
    loop();

    /* ---------- rising particles ---------- */
    const timer = setInterval(() => {
      if (!alive.visible || document.hidden) return;
      const d = document.createElement('div'), z = Math.random() * 10 + 4, dur = Math.random() * 6 + 4;
      d.className = 'pk-dot';
      Object.assign(d.style, { width: z + 'px', height: z + 'px', left: Math.random() * 100 + '%', opacity: Math.random() * 0.4 + 0.2, animation: `pkRise ${dur}s linear forwards` });
      dots.appendChild(d); setTimeout(() => d.remove(), dur * 1000);
    }, 500);

    /* ---------- cleanup (safe under React StrictMode) ---------- */
    return () => {
      alive.v = false; cancelAnimationFrame(raf); clearInterval(timer); ro.disconnect(); io.disconnect(); ctx.revert();
      scene.traverse((o) => o.geometry && o.geometry.dispose());
      [mBlack, mSep, mSleeve, edgeMat, ...insSide, ...insTop].forEach((x) => x.dispose());
      Object.values(TEX).forEach((x) => x.dispose());
      renderer.dispose(); renderer.domElement.remove(); dots.innerHTML = '';
    };
  }, []);

  const outline = { color: 'transparent', WebkitTextStroke: '1.5px #fff' };
  const big = { fontFamily: FONT, fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: '-1px', whiteSpace: 'nowrap', fontSize: compact ? 40 : 64 };

  return (
    <Box
      ref={rootRef}
      onMouseMove={trackPointer}
      onTouchMove={trackPointer}
      onMouseLeave={() => { mouse.current = { nx: 0, ny: 0, on: false }; }}
      sx={{
        '--pk-inner': THEMES.motorcycle['--pk-inner'], '--pk-mid': THEMES.motorcycle['--pk-mid'], '--pk-outer': THEMES.motorcycle['--pk-outer'],
        position: 'relative', isolation: 'isolate', overflow: 'hidden', height, minHeight: 380,
        borderRadius: 4, color: '#fff', userSelect: 'none',
        background: 'radial-gradient(circle at center, var(--pk-inner) 0%, var(--pk-mid) 55%, var(--pk-outer) 100%)',
        boxShadow: '0 12px 32px rgba(10,47,77,0.22)',
        '& .pk-dot': { position: 'absolute', bottom: -20, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.5)', background: 'rgba(255,255,255,.5)' },
        '@keyframes pkRise': { '0%': { transform: 'translate(0,0)', opacity: 0 }, '10%,90%': { opacity: 0.4 }, '100%': { transform: 'translate(30px,-110%)', opacity: 0 } },
        ...sx,
      }}
    >
      <Box ref={dotsRef} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} />
      <Box ref={hostRef} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      <Box sx={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', justifyContent: 'space-between', p: compact ? 2.5 : 4, pointerEvents: 'none' }}>
        {/* Left */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: compact ? '60%' : 360 }}>
          <Typography component="h2" sx={big}><Box component="span" sx={outline}>{title[0]}</Box><br />{title[1]}</Typography>
          {!compact && <Typography sx={{ fontFamily: FONT, color: 'rgba(255,255,255,.75)', fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>{description}</Typography>}
        </Box>

        {/* Right */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', gap: 1.5, pointerEvents: 'auto' }}>
            {CARDS.map(({ id, label, sub, Icon }) => (
              <Box
                key={id}
                role="button" tabIndex={0} aria-pressed={flavor === id}
                onClick={() => api.current.switchFlavor?.(id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && api.current.switchFlavor?.(id)}
                sx={{
                  width: compact ? 104 : 128, p: 1.5, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#fff',
                  bgcolor: 'rgba(255,255,255,.07)', backdropFilter: 'blur(10px)',
                  border: `1px solid ${flavor === id ? ACCENT : 'rgba(255,255,255,.16)'}`,
                  transition: 'all .35s cubic-bezier(.175,.885,.32,1.275)',
                  '&:hover': { transform: 'translateY(-4px)', bgcolor: 'rgba(255,255,255,.13)' },
                  '& svg': { transition: 'transform .45s cubic-bezier(.34,1.56,.64,1)', maxWidth: '100%' },
                  '&:hover svg': { transform: 'rotate(-6deg) scale(1.1)' },
                }}
              >
                <Icon sx={{
                  fontSize: compact ? 40 : 46,
                  color: flavor === id ? ACCENT : 'rgba(255,255,255,.92)',
                  transition: 'color .3s ease',
                }} />
                <Typography sx={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, mt: 0.5 }}>{label}</Typography>
                {!compact && <Typography sx={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{sub}</Typography>}
              </Box>
            ))}
          </Box>
          {!compact && <Typography component="h3" sx={{ ...big, textAlign: 'right' }}><Box component="span" sx={outline}>{sideTitle[0]}</Box><br />{sideTitle[1]}</Typography>}
        </Box>
      </Box>

      <Button
        onClick={() => api.current.toggleAssembly?.()}
        sx={{
          position: 'absolute', zIndex: 3, bottom: 20, left: '50%', transform: 'translateX(-50%)', textTransform: 'none', fontWeight: 600,
          borderRadius: 100, px: 2.5, color: assembled ? ON_ACCENT : '#fff', bgcolor: assembled ? ACCENT : 'rgba(255,255,255,.1)',
          border: `1px solid ${assembled ? ACCENT : 'rgba(255,255,255,.2)'}`, backdropFilter: 'blur(10px)',
          '&:hover': { bgcolor: assembled ? ACCENT : 'rgba(255,255,255,.18)' },
        }}
      >
        {assembled ? 'Explode View' : 'Animate Assembly'}
      </Button>
    </Box>
  );
}