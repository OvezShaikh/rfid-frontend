import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

import unostarLogo from '../assets/unostarlogo.png';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
// Hub locations from the "Strategic Hub Locations" map on unostar.in
const CITIES = [
  { n: 'Pune', lat: 18.52, lon: 73.86, label: true },
  { n: 'Mumbai', lat: 19.08, lon: 72.88 },
  { n: 'A.Nagar', lat: 19.09, lon: 74.74 },
  { n: 'Waluj', lat: 19.85, lon: 75.23 },
  { n: 'Vadodara', lat: 22.31, lon: 73.18, label: true },
  { n: 'NCR Delhi', lat: 28.61, lon: 77.21, label: true },
  { n: 'Jaipur', lat: 26.91, lon: 75.79 },
  { n: 'Pantnagar', lat: 29.02, lon: 79.49 },
  { n: 'Bangalore', lat: 12.97, lon: 77.59 },
  { n: 'Hosur', lat: 12.74, lon: 77.83 },
  { n: 'Chennai', lat: 13.08, lon: 80.27, label: true },
  { n: 'Visakhapatnam', lat: 17.69, lon: 83.22, label: true },
  { n: 'Kolkata', lat: 22.57, lon: 88.36, label: true },
];
// Decorative hub-to-hub links (Pune is the home base). Not actual lanes.
const ROUTES = [
  [0, 5], [0, 4], [0, 8], [0, 10], [0, 11], [0, 12], [0, 7], [0, 1],
  [0, 2], [0, 3], [5, 6], [5, 7], [4, 1], [8, 10], [8, 9], [10, 11], [11, 12],
];
// Client names shown on unostar.in under "Trusted by Industry Leaders"
const PARTNERS = [
  'Mahindra', 'Sandvik', 'Tata Autocomp Systems', 'Britannia',
  'Lear Corporation', 'Yazaki', 'Gestamp', 'Forvia', 'Vodafone',
  'Freudenberg', 'Force MTU', 'Wilo Mather and Platt',
];
// Service lines shown as chips on the hero card. Edit to match your real offering.
const SERVICES = [
  'Transportation',
  'Warehousing',
  'Returnable Packaging',
  'Line-side Delivery',
  'Inventory Visibility',
  'RFID Tracking',
];

/* ------------------------------------------------------------------ */
/*  Math helpers                                                       */
/* ------------------------------------------------------------------ */
const DEG = Math.PI / 180;
const toVec = (lat, lon) => {
  const a = lat * DEG, b = lon * DEG;
  return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
};
const slerp = (p, q, t) => {
  const d = Math.min(1, Math.max(-1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const w = Math.acos(d);
  const s = Math.sin(w) || 1;
  const a = Math.sin((1 - t) * w) / s;
  const b = Math.sin(t * w) / s;
  return [a * p[0] + b * q[0], a * p[1] + b * q[1], a * p[2] + b * q[2]];
};
const fibSphere = (n) => {
  const pts = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    pts.push([Math.cos(g * i) * r, y, Math.sin(g * i) * r]);
  }
  return pts;
};

/* ------------------------------------------------------------------ */
/*  Count-up hook                                                      */
/* ------------------------------------------------------------------ */
function useCountUp(target, ms = 2200, decimals = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(target * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ------------------------------------------------------------------ */
/*  Globe canvas                                                       */
/* ------------------------------------------------------------------ */
function Globe({ onInteract }) {
  const canvasRef = useRef(null);
  const s = useRef({
    ry: -78 * DEG, rx: 0.35, vy: 0, vx: 0,
    drag: false, lx: 0, ly: 0, zoom: 1, mx: -999, my: -999,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const st = s.current;
    const dots = fibSphere(1300);
    const cityVec = CITIES.map((c) => toVec(c.lat, c.lon));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, raf;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (time) => {
      const t = time / 1000;
      // Same rule as the CSS media query: side-by-side on landscape screens,
      // stacked (globe on top, card below) on portrait and narrow screens.
      const side = W >= 720 && W / H >= 1.1;
      let R, cx, cy;
      if (side) {
        const cardRight = W * 0.06 + Math.min(560, W * 0.46);
        const room = W - cardRight;
        R = Math.min(H * 0.33, room * 0.42);
        cx = cardRight + room / 2;
        cy = H * 0.5;
      } else {
        R = Math.min(W * 0.34, H * 0.17);
        cx = W * 0.5;
        cy = H * 0.22;
      }
      R *= st.zoom;

      if (!st.drag) {
        st.ry += st.vy + (reduce ? 0 : 0.0016);
        st.rx += st.vx;
        st.vy *= 0.95;
        st.vx *= 0.95;
      }
      st.rx = Math.max(-0.9, Math.min(1.0, st.rx));

      const cY = Math.cos(st.ry), sY = Math.sin(st.ry);
      const cX = Math.cos(st.rx), sX = Math.sin(st.rx);
      // rotate + perspective project -> {x, y, z}
      const proj = (v, r = 1) => {
        const x1 = v[0] * cY + v[2] * sY;
        const z1 = -v[0] * sY + v[2] * cY;
        const y2 = v[1] * cX - z1 * sX;
        const z2 = v[1] * sX + z1 * cX;
        const f = 3 / (3 - z2 * r);
        return { x: cx + x1 * r * R * f, y: cy - y2 * r * R * f, z: z2 };
      };

      ctx.clearRect(0, 0, W, H);

      // atmosphere glow
      const g = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.5);
      g.addColorStop(0, 'rgba(56,189,248,0.22)');
      g.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // sphere body
      const body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      body.addColorStop(0, 'rgba(14,60,100,0.55)');
      body.addColorStop(1, 'rgba(3,10,20,0.85)');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(125,211,252,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // surface dots
      for (let i = 0; i < dots.length; i++) {
        const p = proj(dots[i]);
        if (p.z > 0) {
          ctx.fillStyle = `rgba(125,211,252,${0.12 + p.z * 0.5})`;
          ctx.fillRect(p.x, p.y, 1.4, 1.4);
        } else {
          ctx.fillStyle = 'rgba(125,211,252,0.05)';
          ctx.fillRect(p.x, p.y, 1, 1);
        }
      }

      // orbit ring with satellite
      ctx.lineWidth = 1;
      let prev = null;
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const v = [Math.cos(a), Math.sin(a) * 0.35, Math.sin(a) * 0.94];
        const p = proj(v, 1.28);
        if (prev) {
          ctx.strokeStyle = `rgba(99,102,241,${p.z > 0 ? 0.5 : 0.15})`;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        prev = p;
      }
      {
        const a = t * 0.6;
        const sp = proj([Math.cos(a), Math.sin(a) * 0.35, Math.sin(a) * 0.94], 1.28);
        ctx.fillStyle = '#a5b4fc';
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // routes + trucks
      ROUTES.forEach(([a, b], idx) => {
        const lift = (u) => 1 + 0.22 * Math.sin(Math.PI * u);
        const SEG = 40;
        let last = null;
        for (let i = 0; i <= SEG; i++) {
          const u = i / SEG;
          const p = proj(slerp(cityVec[a], cityVec[b], u), lift(u));
          if (last) {
            const front = (p.z + last.z) / 2;
            ctx.strokeStyle = `rgba(56,189,248,${front > -0.05 ? 0.22 + front * 0.25 : 0.04})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
          last = p;
        }
        // truck pulse with trail
        const speed = 0.11 + (idx % 4) * 0.025;
        const base = (t * speed + idx * 0.173) % 1;
        for (let k = 0; k < 7; k++) {
          const u = base - k * 0.012;
          if (u < 0) continue;
          const p = proj(slerp(cityVec[a], cityVec[b], u), lift(u));
          if (p.z < -0.1) continue;
          ctx.fillStyle = `rgba(165,243,252,${(1 - k / 7) * 0.95})`;
          if (k === 0) {
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 12;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, k === 0 ? 3 : 2 - k * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // cities
      let hover = -1;
      CITIES.forEach((c, i) => {
        const p = proj(cityVec[i]);
        if (p.z < 0.05) return;
        const ping = (t * 0.7 + i * 0.3) % 1;
        ctx.strokeStyle = `rgba(34,211,238,${(1 - ping) * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + ping * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        const near = Math.hypot(p.x - st.mx, p.y - st.my) < 16;
        if (near) hover = i;
        if (near || (R > 120 && p.z > 0.4 && c.label)) {
          ctx.font = `${near ? 600 : 400} ${near ? 13 : 11}px "DM Sans", sans-serif`;
          ctx.fillStyle = near ? '#ffffff' : 'rgba(224,242,254,0.75)';
          ctx.fillText(c.n, p.x + 9, p.y - 7);
        }
      });
      canvas.style.cursor = hover >= 0 ? 'pointer' : st.drag ? 'grabbing' : 'grab';

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const st = s.current;
  const rect = () => canvasRef.current.getBoundingClientRect();

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive globe of the Unostar hub network across India. Drag to rotate, scroll to zoom."
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 1, touchAction: 'pan-y', cursor: 'grab',
      }}
      onPointerDown={(e) => {
        const r0 = rect();
        st.mx = e.clientX - r0.left; st.my = e.clientY - r0.top;
        st.drag = true; st.lx = e.clientX; st.ly = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
        onInteract();
      }}
      onPointerMove={(e) => {
        const r = rect();
        st.mx = e.clientX - r.left; st.my = e.clientY - r.top;
        if (!st.drag) return;
        const dx = e.clientX - st.lx, dy = e.clientY - st.ly;
        st.ry += dx * 0.006; st.rx += dy * 0.006;
        st.vy = dx * 0.0008; st.vx = dy * 0.0004;
        st.lx = e.clientX; st.ly = e.clientY;
      }}
      onPointerUp={(e) => {
        st.drag = false;
        if (e.pointerType !== 'mouse') setTimeout(() => { st.mx = -999; st.my = -999; }, 1600);
      }}
      onPointerCancel={() => { st.drag = false; }}
      onPointerLeave={() => { st.mx = -999; st.my = -999; }}
      onWheel={(e) => {
        st.zoom = Math.max(0.75, Math.min(1.5, st.zoom - e.deltaY * 0.0012));
        onInteract();
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
const AUTO_MS = 14000;

export default function Landing() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [auto, setAuto] = useState(true);
  const [evt, setEvt] = useState(0);

  // Estimates (assumptions, replace with real figures before going live):
  //  Scans/day = truck gate events 300 x 6 = 1,800
  //            + pallet tag reads 300 trips x 20 pallets x 4 checkpoints = 24,000
  //            + hub/warehouse reads 13 hubs x ~1,200 = 15,600   => ~41,400, shown as 40K+
  const hubs = useCountUp(CITIES.length);
  const trucks = useCountUp(300);
  const scansDay = useCountUp(40, 2400);
  const accuracy = useCountUp(99.99, 2600, 2);

  // Auto-continue to login, cancelled as soon as the visitor interacts
  useEffect(() => {
    if (!auto) return undefined;
    const timer = setTimeout(() => navigate('/login'), AUTO_MS);
    return () => clearTimeout(timer);
  }, [auto, navigate]);

  // Reading or scrolling on a phone should also cancel the auto-redirect
  useEffect(() => {
    const stop = () => setAuto(false);
    window.addEventListener('touchstart', stop, { passive: true, once: true });
    window.addEventListener('wheel', stop, { passive: true, once: true });
    return () => {
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('wheel', stop);
    };
  }, []);

  // Client names panel
  useEffect(() => {
    const id = setInterval(() => setEvt((i) => (i + 1) % PARTNERS.length), 2000);
    return () => clearInterval(id);
  }, []);

  // 3D tilt + moving glare on the card (direct DOM writes, no re-renders)
  useEffect(() => {
    const move = (e) => {
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      el.style.setProperty('--rx', `${dy * -14}deg`);
      el.style.setProperty('--ry', `${dx * 18}deg`);
      el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const feed = [0, 1, 2].map((k) => PARTNERS[(evt + k) % PARTNERS.length]);

  return (
    <Box className="page">
      <Box className="orb orb-1" />
      <Box className="orb orb-2" />

      <Globe onInteract={() => setAuto(false)} />

      {/* Hero card */}
      <Box className="card-wrap">
        <Box ref={cardRef} className="hero-card">
          <Box className="glare" />

          <Box className="card-layer" sx={{ transform: 'translateZ(50px)' }}>
            <Box
              component="img"
              src={unostarLogo}
              alt="Unostar Logistics"
              className="logo"
            />
          </Box>

          <Typography
            className="card-layer"
            sx={{
              transform: 'translateZ(80px)',
              fontWeight: 800,
              fontSize: 'clamp(36px, min(6.4vw, 9.5vh), 72px)',
              letterSpacing: '-2.5px',
              lineHeight: 1.02,
              mt: 2.5,
              background:
                'linear-gradient(120deg, #ffffff 0%, #7dd3fc 40%, #38bdf8 60%, #ffffff 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shine 4s linear infinite',
            }}
          >
            UnoTrace
          </Typography>

          <Typography
            className="card-layer"
            sx={{
              transform: 'translateZ(40px)',
              mt: 1.5, fontWeight: 400, fontSize: 'clamp(14px, 1.2vw + 7px, 18px)',
              color: 'rgba(255,255,255,0.75)', maxWidth: 420, lineHeight: 1.55,
            }}
          >
            Unostar's end-to-end logistics platform. UnoTrace gives you
            real-time visibility across transport, warehousing and
            returnable packaging.
          </Typography>

          {/* Service chips */}
          <Box className="card-layer chips" sx={{ transform: 'translateZ(50px)' }}>
            {SERVICES.map((s) => <span key={s}>{s}</span>)}
          </Box>

          {/* Stats */}
          <Box className="card-layer stats" sx={{ transform: 'translateZ(60px)' }}>
            <Box>
              <b>{hubs}</b>
              <span>hubs across India</span>
            </Box>
            <Box>
              <b>{trucks}+</b>
              <span>trucks in fleet</span>
            </Box>
            <Box>
              <b>{scansDay}K+</b>
              <span>RFID scans a day</span>
            </Box>
            <Box>
              <b>{accuracy}%</b>
              <span>read accuracy</span>
            </Box>
          </Box>

          <Typography
            className="card-layer"
            sx={{ transform: 'translateZ(40px)', mt: 2, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
          >
            Integrated logistics since 2017. ISO 9001:2015 certified.
          </Typography>

          <Box className="card-layer" sx={{ transform: 'translateZ(70px)', mt: 3 }}>
            <Button
              onClick={() => navigate('/login')}
              sx={{
                width: { xs: '100%', sm: 'auto' }, px: 4, py: 1.4, borderRadius: '14px', textTransform: 'none',
                fontWeight: 700, fontSize: 16, color: '#03121f',
                background: 'linear-gradient(135deg, #7dd3fc, #38bdf8)',
                boxShadow: '0 10px 30px rgba(56,189,248,0.45)',
                transition: 'transform .2s, box-shadow .2s',
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.03)',
                  boxShadow: '0 14px 38px rgba(56,189,248,0.65)',
                  background: 'linear-gradient(135deg, #a5e3ff, #38bdf8)',
                },
              }}
            >
              Sign in to UnoTrace
            </Button>
            <Typography sx={{ mt: 1.5, fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
              {auto ? 'Taking you to sign in shortly. Tap or drag to stay.' : 'Drag the globe to explore the network.'}
            </Typography>
          </Box>

          {auto && (
            <Box className="loader-bar">
              <Box className="loader-fill" />
            </Box>
          )}
        </Box>
      </Box>

      {/* Live feed */}
      <Box className="feed">
        <Box className="feed-head">
          Trusted by industry leaders
        </Box>
        {feed.map((line, i) => (
          <Box key={`${evt}-${i}`} className="feed-row" style={{ opacity: 1 - i * 0.3 }}>
            {line}
          </Box>
        ))}
      </Box>

      <style>
        {`
          .page { position:relative; min-height:100vh; min-height:100dvh; width:100%;
            overflow-x:hidden; box-sizing:border-box;
            background: radial-gradient(circle at 20% 15%, #0a1929 0%, #06101c 45%, #03080f 100%);
            font-family:"DM Sans", sans-serif;
            display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
            padding: 42vh 16px calc(32px + env(safe-area-inset-bottom));
            padding-top: 42dvh; }
          .card-wrap { perspective:1200px; z-index:3; width:100%; max-width:560px;
            display:flex; justify-content:center; }

          .orb { position:absolute; border-radius:50%; filter:blur(90px); opacity:.45;
            animation: float 14s ease-in-out infinite; pointer-events:none; }
          .orb-1 { width:min(420px,80vw); height:min(420px,80vw); top:-120px; left:-120px;
            background: radial-gradient(circle,#0ea5e9,transparent 70%); }
          .orb-2 { width:min(500px,90vw); height:min(500px,90vw); bottom:-180px; right:-140px;
            background: radial-gradient(circle,#6366f1,transparent 70%); animation-delay:-5s; }

          .hero-card {
            --rx: 0deg; --ry: 0deg; --gx: 50%; --gy: 50%;
            position: relative;
            width:100%; box-sizing:border-box;
            padding: clamp(24px,3.4vw,44px) clamp(22px,3.6vw,52px) clamp(24px,3.2vw,40px);
            border-radius: 28px;
            background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,255,255,0.13);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 30px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.16);
            transform: rotateX(var(--rx)) rotateY(var(--ry));
            transform-style: preserve-3d;
            transition: transform .12s ease-out;
            text-align: left;
            overflow: visible;
            animation: cardIn 1s cubic-bezier(.2,.8,.2,1) both;
          }
          .card-layer { transform-style: preserve-3d; }
          .glare {
            position:absolute; inset:0; border-radius:28px; pointer-events:none;
            background: radial-gradient(circle at var(--gx) var(--gy), rgba(125,211,252,.22), transparent 45%);
          }

          .logo { display:block; width:100%; height:auto; max-height:clamp(60px, 12vh, 112px);
            object-fit:contain; object-position:center; box-sizing:border-box;
            padding:10px clamp(12px,2vw,24px); border-radius:10px;
            background:#fff; box-shadow:0 10px 28px rgba(0,0,0,.45); }

          .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:clamp(14px,2.4vh,22px); }
          .chips span { font-size:12px; font-weight:500; color:#e0f2fe;
            padding:5px 11px; border-radius:999px;
            background:rgba(56,189,248,.1); border:1px solid rgba(125,211,252,.25); }

          .stats { display:grid; grid-template-columns:repeat(2, auto); justify-content:start; gap:18px clamp(24px,3vw,44px); margin-top:clamp(18px,3vh,28px); }
          .stats > div { display:flex; flex-direction:column; }
          .stats b { font-size:clamp(20px,2.2vw,26px); font-weight:800; color:#fff; letter-spacing:-.5px;
            font-variant-numeric: tabular-nums; }
          .stats span { font-size:12.5px; color:rgba(125,211,252,.85); margin-top:2px; }

          .loader-bar { margin-top:26px; width:100%; height:3px; border-radius:3px;
            background:rgba(255,255,255,.1); overflow:hidden; }
          .loader-fill { height:100%; border-radius:3px; width:100%;
            transform-origin:left;
            background:linear-gradient(90deg,#38bdf8,#a5f3fc);
            animation: fill ${AUTO_MS}ms linear forwards; }

          .feed { display:none; position:fixed; right:3vw; bottom:5vh; z-index:3; width:320px;
            padding:14px 16px; border-radius:16px;
            background:rgba(6,16,28,.6); border:1px solid rgba(125,211,252,.18);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
          .feed-head { display:flex; align-items:center; gap:8px; font-size:13px;
            font-weight:700; color:#e0f2fe; margin-bottom:8px; }
          .feed-head i { width:8px; height:8px; border-radius:50%; background:#22d3ee;
            animation: nodePulse 1.8s ease-out infinite; }
          .feed-row { font-size:13px; color:rgba(255,255,255,.75); padding:4px 0;
            animation: rowIn .5s ease both; white-space:nowrap; overflow:hidden;
            text-overflow:ellipsis; }

          @keyframes shine { to { background-position:200% center; } }
          @keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-40px) scale(1.05)} }
          @keyframes cardIn { from{opacity:0; translate:0 40px} to{opacity:1; translate:0 0} }
          @keyframes fill { from{transform:scaleX(0)} to{transform:scaleX(1)} }
          @keyframes rowIn { from{opacity:0; transform:translateY(8px)} }
          @keyframes nodePulse {
            0%{box-shadow:0 0 0 0 rgba(34,211,238,.7)}
            70%{box-shadow:0 0 0 10px rgba(34,211,238,0)}
            100%{box-shadow:0 0 0 0 rgba(34,211,238,0)}
          }

          /* Landscape screens: card on the left, globe on the right */
          @media (min-width:720px) and (min-aspect-ratio:11/10) {
            .page { flex-direction:row; align-items:center; justify-content:flex-start;
              padding:4vh 0 4vh 6vw; }
            .card-wrap { width:min(560px,46vw); max-width:none; }
          }
          /* Big desktop screens: show the client panel */
          @media (min-width:1000px) and (min-height:620px) and (min-aspect-ratio:11/10) {
            .feed { display:block; }
          }
          /* Short landscape screens (phones turned sideways) */
          @media (max-height:560px) {
            .hero-card { padding:18px 26px; }
            .logo { max-height:52px; padding:6px 12px; }
            .chips { margin-top:10px; }
            .stats { gap:10px 32px; margin-top:14px; }
            .loader-bar { margin-top:14px; }
          }
          @media (max-width:380px) {
            .hero-card { padding:22px 18px; }
            .stats { gap:14px 20px; }
            .stats b { font-size:19px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .orb, .hero-card, .feed-row { animation:none; }
            .hero-card { transition:none; }
          }
        `}
      </style>
    </Box>
  );
}