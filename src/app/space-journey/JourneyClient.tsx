"use client";

/**
 * WyberAi — "Deep Space" scroll journey (v2, cinematic).
 * Single-file prototype. Pilot the Wyber rocket through 6 waypoints mapping
 * 1:1 to the funnel: Hero → How it works → Live build → Why us → Models → Pricing.
 *
 * v2 skin: NASA planet textures (public/space, CC-BY solarsystemscope.com),
 * bloom/grain/vignette post-processing, particle exhaust + trail, in-scene
 * tilted glass panels (drei Html transform), floating JetBrains Mono 3D labels,
 * WyberAi brand chrome (logo, Switzer/General Sans/JetBrains Mono, #0EA5E9).
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ScrollControls,
  Scroll,
  useScroll,
  Stars,
  Html,
  Text,
  Float,
  Sparkles,
  Trail,
  useTexture,
  useGLTF,
  Environment,
} from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { WyberLogo } from "@/components/shared/WyberLogo";
import { type Currency, formatPrice } from "@/lib/currency";

// ————————————————————————————————————————————— journey constants
const PAGES = 6;
const SEG = 55;
const TRAVEL = SEG * (PAGES - 1);
const TEX = (f: string) => `/space/${f}`;
const MONO_TTF = "/space/JetBrainsMono-Bold.ttf";
// candidates: wyber-ship | ship-rocket | ship-yacht | ship-fighter
const SHIP_FILE = "ship-fighter.glb";

const NAV = ["Launch", "How", "Build", "Why", "Models", "Pricing"];

// =====================================================================
// CAMERA RIG — flies down -Z with cinematic sway; mirrors telemetry into
// the fixed cockpit chrome (direct DOM writes, prototype-grade).
// =====================================================================
function Rig() {
  const scroll = useScroll();
  const prev = useRef(0);
  useFrame((state, delta) => {
    const o = scroll.offset;
    const z = 10 - o * TRAVEL;
    const swayX = Math.sin(o * Math.PI * 4) * 1.6;
    const swayY = Math.sin(o * Math.PI * 6) * 0.5;
    state.camera.position.set(swayX, swayY, z);
    state.camera.lookAt(swayX * 0.35, swayY * 0.3, z - 40);

    const v = Math.abs(o - prev.current) / Math.max(delta, 1e-4);
    prev.current = o;
    const bar = document.getElementById("wy-progress");
    if (bar) bar.style.transform = `scaleX(${Math.max(0.005, o)})`;
    const vel = document.getElementById("wy-vel");
    if (vel) vel.textContent = (v * 2.4).toFixed(2);
    const alt = document.getElementById("wy-alt");
    if (alt) alt.textContent = Math.round(Math.abs(z - 10) * 47.3).toString().padStart(5, "0");
    const active = Math.min(PAGES - 1, Math.round(o * (PAGES - 1)));
    const wp = document.getElementById("wy-wp");
    if (wp) wp.textContent = String(active + 1).padStart(2, "0");
    document.querySelectorAll<HTMLElement>("[data-wy-dot]").forEach((d, i) => {
      d.style.background = i === active ? "#38bdf8" : "rgba(255,255,255,0.18)";
      d.style.boxShadow = i === active ? "0 0 10px rgba(56,189,248,0.9)" : "none";
    });
    document.querySelectorAll<HTMLElement>("[data-wy-nav]").forEach((n, i) => {
      n.style.color = i === active ? "#38bdf8" : "";
    });
  });
  return null;
}

// Render tuning: filmic exposure + soft IBL so materials read as metal and
// paint instead of unlit plastic. This is the "expensive look" lever.
function SceneTuning() {
  const { scene, gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = 1.15;
    scene.environmentIntensity = 0.4;
  }, [scene, gl]);
  return null;
}

// Bridge: exposes drei's internal scroll element to the fixed nav chrome.
function ScrollBridge({ elRef }: { elRef: React.MutableRefObject<HTMLElement | null> }) {
  const scroll = useScroll();
  useEffect(() => {
    elRef.current = scroll.el;
  }, [scroll, elRef]);
  return null;
}

// =====================================================================
// THE SHIP — white Wyber rocket (WY-01), locked bottom-center. Banks with
// scroll velocity; cyan exhaust trail + particle plume when boosting.
// =====================================================================
function Ship() {
  const anchor = useRef<THREE.Group>(null);
  const hull = useRef<THREE.Group>(null);
  const orient = useRef<THREE.Group>(null);
  const exhaust = useRef<THREE.Group>(null);
  const glowMat = useRef<THREE.MeshStandardMaterial>(null);
  const scroll = useScroll();
  const prevOffset = useRef(0);

  useFrame((state) => {
    if (!anchor.current || !hull.current) return;
    const t = state.clock.elapsedTime;
    anchor.current.position.copy(state.camera.position);
    anchor.current.quaternion.copy(state.camera.quaternion);
    const d = scroll.offset - prevOffset.current;
    prevOffset.current = scroll.offset;
    hull.current.rotation.z = THREE.MathUtils.lerp(hull.current.rotation.z, -d * 50, 0.12);
    hull.current.rotation.x = THREE.MathUtils.lerp(hull.current.rotation.x, d * 26, 0.12);
    hull.current.position.y = -1.55 + Math.sin(t * 1.6) * 0.05;
    if (orient.current) {
      // beauty shot: rest in side profile at the hero, swing into the flight
      // line over the first stretch of scroll
      // model's native nose points -X, so -PI/2 aims it down the flight line
      const sideways = (1 - THREE.MathUtils.clamp(scroll.offset * 5, 0, 1)) * (Math.PI / 2.3);
      orient.current.rotation.y = THREE.MathUtils.lerp(orient.current.rotation.y, -Math.PI / 2 + sideways, 0.08);
      // exhaust rig tracks the tail (offset by the model's -PI/2 base yaw)
      if (exhaust.current) exhaust.current.rotation.y = orient.current.rotation.y + Math.PI / 2;
    }
    if (glowMat.current) {
      glowMat.current.emissiveIntensity = 2.2 + Math.sin(t * 24) * 0.5 + Math.min(6, Math.abs(d) * 1000);
    }
  });

  // Custom Meshy-generated ship — real PBR textures, do NOT recolor.
  const { scene } = useGLTF(TEX(SHIP_FILE));
  const { model, shipScale } = useMemo(() => {
    const m = scene.clone(true);
    // recenter pivot + normalize length to ~3.1 units
    const box = new THREE.Box3().setFromObject(m);
    m.position.sub(box.getCenter(new THREE.Vector3()));
    const size = box.getSize(new THREE.Vector3());
    const s = 3.4 / Math.max(size.x, size.y, size.z);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        // matte ceramic read, kept deliberately understated — the ship should
        // never outshine the engines or the scenery
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.envMapIntensity = 0.3;
        mat.roughness = Math.min(1, mat.roughness + 0.25);
        mat.metalness = Math.min(mat.metalness, 0.3);
        mat.color.multiplyScalar(0.82);
      }
    });
    return { model: m, shipScale: s };
  }, [scene]);

  return (
    <group ref={anchor}>
      <group ref={hull} position={[0, -1.55, -6]}>
        {/* yaw driven per-frame: side-profile beauty shot at rest → flight line */}
        <group ref={orient} rotation={[0.1, 0, 0]} scale={shipScale}>
          <primitive object={model} />
        </group>
        {/* engine glow + trail, yawing with the tail */}
        <group ref={exhaust}>
          <Trail width={1.2} length={6} color={"#22d3ee"} attenuation={(w) => w * w}>
            <mesh position={[0, 0, 1.35]}>
              <sphereGeometry args={[0.1, 12, 12]} />
              <meshStandardMaterial ref={glowMat} color="#0ea5e9" emissive="#22d3ee" emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          </Trail>
          <Sparkles count={22} position={[0, 0, 2]} scale={[0.4, 0.35, 1.8]} size={1.7} speed={2.4} color="#67e8f9" opacity={0.5} noise={0.4} />
          <pointLight position={[0, 0.1, 1.7]} intensity={7} distance={7} color="#22d3ee" />
        </group>
        {/* dedicated ship lighting: just enough to separate the hull from black
            space without making it glow — the engines are the bright part */}
        <pointLight position={[2.2, 2.6, 2.2]} intensity={4.5} distance={10} color="#f8fafc" />
        <pointLight position={[-1.8, -1.6, -1.2]} intensity={1.8} distance={8} color="#7dd3fc" />
      </group>
    </group>
  );
}

// =====================================================================
// STARFIELD — follows camera at 0.85x for parallax.
// =====================================================================
function StarField() {
  const g = useRef<THREE.Group>(null);
  const sky = useTexture(TEX("2k_stars_milky_way.jpg"));
  useFrame(({ camera }) => {
    if (g.current) g.current.position.z = camera.position.z * 0.85;
  });
  return (
    <group ref={g}>
      {/* galaxy backdrop — the rich-but-black deep space bed everything sits on */}
      <mesh rotation={[0.3, 1.2, 0]}>
        <sphereGeometry args={[380, 48, 48]} />
        <meshBasicMaterial map={sky} side={THREE.BackSide} fog={false} color="#8f96b8" />
      </mesh>
      <Stars radius={160} depth={100} count={3500} factor={1.6} saturation={0} fade speed={0.4} />
    </group>
  );
}

// =====================================================================
// WAYPOINT 1 — THE LAUNCHPAD: textured Earth (day map + city lights +
// drifting cloud layer) rising from the lower-left, Mars far right.
// =====================================================================
function LaunchEarth() {
  const [day, night, clouds] = useTexture([TEX("2k_earth_daymap.jpg"), TEX("2k_earth_nightmap.jpg"), TEX("2k_earth_clouds.jpg")]);
  const planet = useRef<THREE.Group>(null);
  const cloud = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (planet.current) planet.current.rotation.y += delta * 0.02;
    if (cloud.current) cloud.current.rotation.y += delta * 0.032;
  });
  return (
    <group position={[-4, -30, -58]}>
      <group ref={planet} rotation={[0.35, 2.2, 0.1]}>
        <mesh>
          <sphereGeometry args={[26, 64, 64]} />
          <meshStandardMaterial map={day} emissiveMap={night} emissive="#ffc98a" emissiveIntensity={0.7} roughness={0.9} metalness={0} fog={false} />
        </mesh>
      </group>
      <mesh ref={cloud}>
        <sphereGeometry args={[26.3, 48, 48]} />
        <meshStandardMaterial map={clouds} transparent opacity={0.38} blending={THREE.AdditiveBlending} depthWrite={false} roughness={1} fog={false} />
      </mesh>
      {/* atmosphere */}
      <mesh>
        <sphereGeometry args={[27, 48, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.1} blending={THREE.AdditiveBlending} side={THREE.BackSide} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[29, 48, 48]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.04} blending={THREE.AdditiveBlending} side={THREE.BackSide} fog={false} />
      </mesh>
      <pointLight position={[18, 34, 26]} intensity={520} distance={150} color="#bfdbfe" />
    </group>
  );
}

function HeroMars() {
  const tex = useTexture(TEX("2k_mars.jpg"));
  return (
    <mesh position={[26, 12, -46]} rotation={[0.2, 1.1, 0]}>
      <sphereGeometry args={[4.5, 32, 32]} />
      <meshStandardMaterial map={tex} roughness={0.95} fog={false} />
    </mesh>
  );
}

// =====================================================================
// WAYPOINT 2 — THE IDEA NEBULA: moon-rock asteroid corridor, colored gas,
// drifting sparkles, Mars looming in the background.
// =====================================================================
function IdeaNebula() {
  const rock = useTexture(TEX("2k_moon.jpg"));
  const mars = useTexture(TEX("2k_mars.jpg"));
  const group = useRef<THREE.Group>(null);
  const rocks = useMemo(
    () =>
      Array.from({ length: 44 }, () => ({
        pos: [
          (Math.random() < 0.5 ? -1 : 1) * (5.5 + Math.random() * 24),
          (Math.random() - 0.5) * 22,
          -72 - Math.random() * 48, // start past the hero frame — keeps waypoint 1 clean
        ] as [number, number, number],
        scale: 0.4 + Math.random() * 1.1,
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      })),
    []
  );
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.006;
  });
  return (
    <>
      <group ref={group}>
        {rocks.map((r, i) => (
          <mesh key={i} position={r.pos} rotation={r.rot} scale={r.scale}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial map={rock} roughness={1} />
          </mesh>
        ))}
      </group>
      {/* Mars is waypoint-2's body — fogged, so it only reveals on arrival */}
      <mesh position={[-30, 10, -95]} rotation={[0.2, 0.8, 0]}>
        <sphereGeometry args={[10, 48, 48]} />
        <meshStandardMaterial map={mars} roughness={0.95} />
      </mesh>
      <pointLight position={[15, 7, -80]} intensity={360} distance={80} color="#a855f7" />
      <pointLight position={[-17, -5, -100]} intensity={320} distance={80} color="#22d3ee" />
    </>
  );
}

// =====================================================================
// WAYPOINT 3 — THE ORBITAL FORGE: rotating station, Neptune backdrop.
// =====================================================================
function OrbitalForge() {
  const neptune = useTexture(TEX("2k_neptune.jpg"));
  // Custom Meshy-generated station — PBR textured, do not recolor.
  const { scene } = useGLTF(TEX("wyber-station.glb"));
  const station = useMemo(() => {
    const m = scene.clone(true);
    const box = new THREE.Box3().setFromObject(m);
    m.position.sub(box.getCenter(new THREE.Vector3()));
    const size = box.getSize(new THREE.Vector3());
    const s = 17 / Math.max(size.x, size.y, size.z);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.material) (mesh.material as THREE.MeshStandardMaterial).envMapIntensity = 1.1;
    });
    return { m, s };
  }, [scene]);
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.06;
  });
  return (
    <>
      <group position={[-13, 3.5, -122]} rotation={[0.08, 0.35, 0]}>
        <group ref={spin} scale={station.s}>
          <primitive object={station.m} />
        </group>
        <Sparkles count={12} position={[4, -2, 3]} scale={[3, 3, 3]} size={1.8} speed={1.6} color="#fdba74" opacity={0.7} noise={1} />
        <pointLight position={[3, -1, 6]} intensity={300} distance={55} color="#fb923c" />
        <pointLight position={[-4, 5, 3]} intensity={180} distance={50} color="#38bdf8" />
      </group>
      {/* Neptune is waypoint-3's body — fogged until the forge approach */}
      <mesh position={[24, -7, -134]} rotation={[0.1, 0.4, 0.1]}>
        <sphereGeometry args={[15, 48, 48]} />
        <meshStandardMaterial map={neptune} roughness={0.85} />
      </mesh>
    </>
  );
}

// =====================================================================
// WAYPOINT 4 — THE DEFENSE GRID: lattice of pulsing satellites.
// =====================================================================
function DefenseGrid() {
  // Custom Meshy-generated satellite, cloned into a lattice (clones share
  // geometry/material buffers, so GPU cost stays low).
  const { scene } = useGLTF(TEX("wyber-satellite.glb"));
  const proto = useMemo(() => {
    const m = scene.clone(true);
    const box = new THREE.Box3().setFromObject(m);
    m.position.sub(box.getCenter(new THREE.Vector3()));
    const size = box.getSize(new THREE.Vector3());
    const s = 2.6 / Math.max(size.x, size.y, size.z);
    m.scale.setScalar(s);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.material) (mesh.material as THREE.MeshStandardMaterial).envMapIntensity = 1.2;
    });
    return m;
  }, [scene]);
  const grid = useRef<THREE.Group>(null);
  const sats = useMemo(() => {
    const out: { pos: [number, number, number]; phase: number }[] = [];
    for (let col = 0; col < 5; col++)
      for (let row = 0; row < 3; row++)
        out.push({
          pos: [(col - 2) * 7.5, (row - 1) * 5.5 + 1, -170 - (row % 2) * 6 - col * 1.5],
          phase: col * 1.3 + row * 2.1,
        });
    return out;
  }, []);
  const clones = useMemo(() => sats.map(() => proto.clone()), [proto, sats]);
  useFrame(({ clock }) => {
    if (!grid.current) return;
    grid.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.05;
    grid.current.children.forEach((child, i) => {
      child.rotation.y = clock.elapsedTime * 0.15 + sats[i].phase;
    });
  });
  return (
    <>
      <group ref={grid}>
        {sats.map((s, i) => (
          <group key={i} position={s.pos}>
            <primitive object={clones[i]} />
            {/* sensor glow on every 3rd unit — pulsing-grid feel without 15 lights */}
            {i % 3 === 0 ? <pointLight intensity={5} distance={6} color="#22d3ee" /> : null}
          </group>
        ))}
      </group>
      <pointLight position={[0, 4, -168]} intensity={240} distance={65} color="#38bdf8" />
    </>
  );
}

// =====================================================================
// WAYPOINT 5 — THE MODEL SYSTEM: textured Jupiter, real ring plane,
// three glowing moons (Opus / Sonnet / Haiku).
// =====================================================================
function ModelSystem() {
  const [jup, ringTex] = useTexture([TEX("2k_jupiter.jpg"), TEX("2k_saturn_ring_alpha.png")]);
  const moons = useRef<THREE.Group>(null);
  const planet = useRef<THREE.Mesh>(null);
  // RingGeometry with radial UVs so the ring strip texture maps correctly
  const ringGeo = useMemo(() => {
    const inner = 19, outer = 30;
    const g = new THREE.RingGeometry(inner, outer, 128, 1);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos as THREE.BufferAttribute, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, []);
  useFrame((_, delta) => {
    if (moons.current) moons.current.rotation.y += delta * 0.2;
    if (planet.current) planet.current.rotation.y += delta * 0.03;
  });
  const moonSpecs = [
    { r: 19, size: 1.0, color: "#38bdf8" }, // Opus
    { r: 23, size: 0.85, color: "#a78bfa" }, // Sonnet
    { r: 27, size: 0.65, color: "#34d399" }, // Haiku
  ];
  return (
    <group position={[23, -3, -237]}>
      <mesh ref={planet} rotation={[0.25, 0, 0.12]}>
        <sphereGeometry args={[17, 64, 64]} />
        <meshStandardMaterial map={jup} roughness={0.8} fog={false} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[Math.PI / 2.25, 0.15, 0]}>
        <meshBasicMaterial map={ringTex} side={THREE.DoubleSide} transparent opacity={0.85} depthWrite={false} fog={false} />
      </mesh>
      <group ref={moons} rotation={[0.22, 0, 0]}>
        {moonSpecs.map((m, i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * m.r, 0, Math.sin(i * 2.1) * m.r]}>
            <sphereGeometry args={[m.size, 20, 20]} />
            <meshStandardMaterial color={m.color} emissive={m.color} emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight position={[-20, 12, 14]} intensity={420} distance={110} color="#fde68a" />
    </group>
  );
}

// =====================================================================
// WAYPOINT 6 — THE DESTINATION STAR: textured sun + bloom = blinding.
// =====================================================================
function DestinationStar() {
  const sun = useTexture(TEX("2k_sun.jpg"));
  const core = useRef<THREE.Mesh>(null);
  useFrame(({ clock, camera }) => {
    if (!core.current) return;
    core.current.rotation.y += 0.0008;
    // distant beacon → blinding star: shrink with distance so the hero sees
    // a bright point, not a dull orange disc, and it swells on approach
    const dist = Math.abs(camera.position.z - -307);
    const near = THREE.MathUtils.clamp(1 - (dist - 60) / 320, 0.16, 1);
    core.current.scale.setScalar(near * (1 + Math.sin(clock.elapsedTime * 1.3) * 0.015));
  });
  const hot = useMemo(() => new THREE.Color(1.9, 1.55, 1.1), []);
  return (
    <group position={[0, 3, -307]}>
      <mesh ref={core}>
        <sphereGeometry args={[18, 64, 64]} />
        <meshBasicMaterial map={sun} color={hot} toneMapped={false} fog={false} />
      </mesh>
      {/* glow shells respect fog so they only ignite on final approach;
          the core stays a distant beacon the whole journey */}
      {[24, 33, 48].map((r, i) => (
        <mesh key={r}>
          <sphereGeometry args={[r, 32, 32]} />
          <meshBasicMaterial
            color={i === 0 ? "#fde68a" : "#f59e0b"}
            transparent
            opacity={[0.14, 0.06, 0.025][i]}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      <pointLight intensity={3200} distance={200} color="#fff7ed" />
    </group>
  );
}

// =====================================================================
// FLOATING 3D SECTION LABELS — JetBrains Mono, hanging in space.
// =====================================================================
function SectionLabel({ position, children }: { position: [number, number, number]; children: string }) {
  const ref = useRef<any>(null);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    const dist = Math.abs(camera.position.z - position[2]);
    ref.current.fillOpacity = THREE.MathUtils.clamp(1 - (dist - 30) / 30, 0, 0.8);
  });
  return (
    <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.5}>
      <Text
        ref={ref}
        position={position}
        font={MONO_TTF}
        fontSize={0.85}
        letterSpacing={0.3}
        color="#7dd3fc"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
      >
        {children}
      </Text>
    </Float>
  );
}

// =====================================================================
// IN-SCENE GLASS PANELS — tilted HTML cards living at 3D depth.
// pointer-events disabled so wheel-scroll passes through to the journey.
// =====================================================================
function Panel({
  position,
  rotation = [0, 0, 0],
  w = 250,
  children,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  w?: number;
  children: React.ReactNode;
}) {
  // HTML ignores scene fog — fade panels by camera distance instead so
  // upcoming waypoints don't clutter the current frame.
  const div = useRef<HTMLDivElement>(null);
  // Inside ScrollControls, Html must portal into the scroll-fixed layer or
  // it inherits the scrolled offset and projects off-screen.
  const scroll = useScroll();
  const portalRef = useMemo(() => ({ current: scroll.fixed }), [scroll.fixed]);
  useFrame(({ camera }) => {
    if (!div.current) return;
    const dist = Math.abs(camera.position.z - position[2]);
    const o = THREE.MathUtils.clamp(1 - (dist - 26) / 28, 0, 1);
    div.current.style.opacity = o.toFixed(3);
    div.current.style.visibility = o < 0.02 ? "hidden" : "visible";
  });
  return (
    <Html
      transform
      portal={portalRef as React.MutableRefObject<HTMLElement>}
      position={position}
      rotation={rotation}
      distanceFactor={11}
      zIndexRange={[5, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={div}
        style={{ width: w }}
        className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0a101e]/80 shadow-[0_20px_60px_rgba(2,6,23,0.6),0_0_40px_rgba(14,165,233,0.12)] backdrop-blur-md"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-sky-500 via-cyan-400/60 to-transparent" />
        <div className="p-6">{children}</div>
      </div>
    </Html>
  );
}

function StepPanel({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="font-mono text-2xl font-bold text-sky-400/90">{n}</span>
      <div>
        <h3 className="wy-display text-[17px] font-bold tracking-tight text-white">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300/90">{desc}</p>
      </div>
    </div>
  );
}

function ScenePanels() {
  return (
    <>
      {/* WP2 — how it works, staggered around the page-1 parking spot (z=-45) */}
      <SectionLabel position={[0, 5.6, -66]}>{"02 · HOW IT WORKS"}</SectionLabel>
      <Panel position={[-5.5, 2.4, -63]} rotation={[0, 0.38, 0.02]}>
        <StepPanel n="01" title="Describe your app" desc="Tell Wyber what you want in plain English." />
      </Panel>
      <Panel position={[6, -0.4, -67]} rotation={[0, -0.42, -0.02]}>
        <StepPanel n="02" title="AI builds it live" desc="Watch as AI generates production-ready code in real-time." />
      </Panel>
      <Panel position={[-5.2, -3.2, -71]} rotation={[0, 0.34, 0.02]}>
        <StepPanel n="03" title="Ship it" desc="Deploy to a live URL with one click." />
      </Panel>

      {/* WP3 — live build terminal, tilted opposite the station (park z=-100) */}
      <SectionLabel position={[-2, 6, -122]}>{"03 · LIVE BUILD"}</SectionLabel>
      <Panel position={[5.5, 0.4, -120]} rotation={[0, -0.45, 0]} w={330}>
        <div className="font-mono text-[12px] leading-relaxed">
          <div className="mb-3 flex items-center gap-1.5 border-b border-white/10 pb-2.5">
            <span className="h-2 w-2 rounded-full bg-red-500/80" />
            <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
            <span className="h-2 w-2 rounded-full bg-green-500/80" />
            <span className="ml-2 text-[10px] text-slate-500">wyber — build console</span>
          </div>
          <p className="text-slate-300"><span className="text-sky-400">&gt;</span> Prompt received: <span className="text-white">&quot;Build a CRM&quot;</span></p>
          <p className="text-slate-300"><span className="text-sky-400">&gt;</span> Generating React code <span className="text-slate-500">(14 files)</span> <span className="text-emerald-400">✓</span></p>
          <p className="text-slate-300"><span className="text-sky-400">&gt;</span> Provisioning Supabase schema <span className="text-emerald-400">✓</span></p>
          <p className="text-slate-300"><span className="text-sky-400">&gt;</span> Deployed to Vercel <span className="text-emerald-400">✓ LIVE</span></p>
          <p className="text-emerald-400"><span className="text-sky-400">&gt;</span> <span className="animate-pulse">▊</span></p>
        </div>
      </Panel>

      {/* WP4 — moats floating inside the satellite lattice (park z=-155) */}
      <SectionLabel position={[0, 6.4, -177]}>{"04 · THE DEFENSE GRID"}</SectionLabel>
      {(
        [
          ["Fresh code every time", "Every app generated from scratch for your exact spec.", [-6, 3.2, -175], 0.32],
          ["Self-healing builds", "Broken imports and build errors repaired automatically.", [6.4, 3.4, -177], -0.32],
          ["Live security scanning", "We probe your live database like an attacker would.", [-7.4, -0.4, -179], 0.36],
          ["Full-stack out of the box", "Frontend, database, auth and hosting on day one.", [7.4, -0.7, -182], -0.36],
          ["GitHub integration", "Your code is yours. Sync it, take it anywhere.", [-7, -4.2, -185], 0.32],
          ["Engineered, not generated", "One canonical build lane. No black boxes.", [7, -4.5, -188], -0.32],
        ] as [string, string, [number, number, number], number][]
      ).map(([title, desc, pos, ry]) => (
        <Panel key={title} position={pos} rotation={[0, ry, 0]} w={230}>
          <h3 className="wy-display text-[15px] font-bold tracking-tight text-white">{title}</h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300/90">{desc}</p>
        </Panel>
      ))}

      {/* WP5 — model routing, left of the gas giant (park z=-210) */}
      <SectionLabel position={[-1, 6.4, -232]}>{"05 · SMART MODEL ROUTING"}</SectionLabel>
      {(
        [
          ["Opus", "Full app builds", "Maximum reasoning for architecture-level work", "#38bdf8", [-6.5, 2.8, -228], 0.36],
          ["Sonnet", "Edits & iterations", "Fast, precise changes to existing code", "#a78bfa", [-7, -0.8, -233], 0.32],
          ["Haiku", "Instant tasks", "When speed matters more than depth", "#34d399", [-6.5, -4.4, -238], 0.36],
        ] as [string, string, string, string, [number, number, number], number][]
      ).map(([name, role, desc, dot, pos, ry]) => (
        <Panel key={name} position={pos} rotation={[0, ry, 0]} w={250}>
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot, boxShadow: `0 0 12px ${dot}` }} />
            <div>
              <p className="wy-display text-[15px] font-bold tracking-tight text-white">
                {name} <span className="ml-1 font-mono text-[11px] font-normal text-sky-400/80">→ {role}</span>
              </p>
              <p className="mt-0.5 text-[12.5px] text-slate-300/90">{desc}</p>
            </div>
          </div>
        </Panel>
      ))}

      {/* no 3D label for waypoint 6 — the flat HUD kicker owns the finale */}
    </>
  );
}

// =====================================================================
// FLAT HUD — hero + pricing stay crisp 2D for conversion.
// =====================================================================
function HudSection({ i, className = "", children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <section className={`absolute left-0 h-screen w-screen ${className}`} style={{ top: `${i * 100}vh` }}>
      {children}
    </section>
  );
}

function GlassCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md shadow-[0_0_40px_rgba(14,165,233,0.08)] ${className}`}>
      {children}
    </div>
  );
}

function Hud({ currency }: { currency: Currency }) {
  return (
    <>
      {/* ——— WAYPOINT 1 · THE LAUNCHPAD ——— */}
      <HudSection i={0} className="flex flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="mb-4 font-mono text-[11px] tracking-[0.35em] text-sky-400/90 uppercase">Waypoint 01 · The Launchpad</p>
        <h1 className="wy-display max-w-4xl text-5xl font-extrabold leading-[1.04] tracking-tight text-white md:text-7xl">
          Think of an app idea.
          <br />
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">Bring it to life.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
          Self-healing builds. Live database security scans. The right AI model chosen for every task.
          Other builders generate code and hope. <span className="font-semibold text-white">WyberAi engineers it.</span>
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-sm text-slate-400">
          <span><span className="font-bold text-sky-400">2,400+</span> apps built</span>
          <span className="hidden h-4 w-px bg-white/15 md:block" />
          <span><span className="font-bold text-sky-400">30s</span> avg build time</span>
          <span className="hidden h-4 w-px bg-white/15 md:block" />
          <span><span className="font-bold text-sky-400">99.9%</span> uptime</span>
        </div>
        <div className="mt-9 flex items-center gap-4">
          <a
            href="/signup"
            className="rounded-full bg-sky-500 px-9 py-4 text-base font-semibold text-white shadow-[0_0_50px_rgba(14,165,233,0.5)] transition hover:bg-sky-400 hover:shadow-[0_0_70px_rgba(14,165,233,0.7)]"
          >
            Start building — it&apos;s free →
          </a>
          <a
            href="/use-cases"
            className="rounded-full border border-white/15 px-7 py-4 text-base font-medium text-slate-200 backdrop-blur-sm transition hover:border-sky-400/50 hover:text-white"
          >
            See what you can build
          </a>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce font-mono text-[11px] tracking-[0.3em] text-slate-500 uppercase">
          ▼ Scroll to launch
        </div>
      </HudSection>

      {/* ——— WAYPOINT 6 · THE DESTINATION STAR ——— */}
      <HudSection i={5} className="flex flex-col items-center justify-center px-6">
        <p className="mb-3 font-mono text-[11px] tracking-[0.35em] text-amber-300/90 uppercase">Waypoint 06 · The Destination Star</p>
        <h2 className="wy-display mb-6 text-center text-2xl font-extrabold text-white md:text-4xl">Choose your trajectory.</h2>
        {/* Region-aware pricing, mirroring /pricing exactly: India (IP=IN) sees
            Spark + smart INR prices + UPI and no done-for-you (low intent);
            everyone else sees the USD dual funnel. */}
        {currency === "INR" ? (
          <div className="w-full max-w-md">
            <GlassCard className="!bg-[#0b1120]/70">
              <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-sky-400 uppercase">Self-serve · Build it yourself</p>
              <ul className="divide-y divide-white/[0.06]">
                {(
                  [
                    ["Spark", 499, "India entry", false],
                    ["Starter", 1499, null, false],
                    ["Builder", 3999, null, true],
                    ["Pro", 9999, null, false],
                  ] as [string, number, string | null, boolean][]
                ).map(([name, price, badge, hot]) => (
                  <li key={name} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 font-medium text-white">
                      {name}
                      {badge ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 uppercase">
                          {badge}
                        </span>
                      ) : null}
                      {hot ? (
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sky-300 uppercase">
                          Most popular
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-slate-300">
                      <span className="text-lg font-bold text-white">{formatPrice(price, "INR")}</span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center font-mono text-[11px] text-slate-500">Pay with UPI · billed in ₹</p>
            </GlassCard>
          </div>
        ) : (
          <div className="grid w-full max-w-3xl grid-cols-2 gap-4 max-md:max-w-md max-md:grid-cols-1">
            <GlassCard className="!bg-[#0b1120]/70">
              <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-sky-400 uppercase">Self-serve · Build it yourself</p>
              <ul className="divide-y divide-white/[0.06]">
                {(
                  [
                    ["Starter", 29, false],
                    ["Builder", 79, true],
                    ["Pro", 199, false],
                  ] as [string, number, boolean][]
                ).map(([name, price, hot]) => (
                  <li key={name} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 font-medium text-white">
                      {name}
                      {hot ? (
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sky-300 uppercase">
                          Most popular
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-slate-300">
                      <span className="text-lg font-bold text-white">{formatPrice(price, "USD")}</span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard className="!bg-[#0b1120]/70">
              <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-amber-400 uppercase">Done-for-you · We build it</p>
              <ul className="divide-y divide-white/[0.06]">
                {(
                  [
                    ["Simple Build", 199],
                    ["Medium Build", 399],
                    ["Complex Build", 799],
                  ] as [string, number][]
                ).map(([name, price]) => (
                  <li key={name} className="flex items-center justify-between py-2">
                    <span className="font-medium text-white">{name}</span>
                    <span className="font-mono text-lg font-bold text-white">{formatPrice(price, "USD")}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        )}
        <h3 className="wy-display mt-6 text-center text-xl font-bold text-white md:text-3xl">
          Your next app is <span className="text-sky-400">one prompt away.</span>
        </h3>
        <a
          href="/signup"
          className="mt-4 rounded-full bg-sky-500 px-10 py-3.5 text-base font-semibold text-white shadow-[0_0_60px_rgba(14,165,233,0.55)] transition hover:bg-sky-400"
        >
          Start building — it&apos;s free
        </a>
        <p className="mt-2.5 text-xs text-slate-500">No credit card required.</p>
      </HudSection>
    </>
  );
}

// Preload heavyweight assets so nothing pops in mid-journey.
useGLTF.preload(TEX(SHIP_FILE));
useGLTF.preload(TEX("wyber-station.glb"));
useGLTF.preload(TEX("wyber-satellite.glb"));

// =====================================================================
// PAGE
// =====================================================================
export function JourneyClient({ currency }: { currency: Currency }) {
  // Client-only: WebGL gains nothing from SSR and skipping hydration
  // sidesteps mismatches (incl. local AV script injection).
  const [mounted, setMounted] = useState(false);
  const scrollElRef = useRef<HTMLElement | null>(null);
  useEffect(() => setMounted(true), []);

  const jumpTo = (i: number) => {
    const el = scrollElRef.current;
    if (!el) return;
    el.scrollTo({ top: (i / (PAGES - 1)) * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
  };

  if (!mounted) {
    return (
      <div className="wy-journey flex h-[100dvh] w-full items-center justify-center bg-[#030014]">
        <p className="animate-pulse font-mono text-xs tracking-[0.4em] text-sky-400 uppercase">Initializing launch sequence…</p>
      </div>
    );
  }

  return (
    <div className="wy-journey relative h-[100dvh] w-full overflow-hidden bg-[#030014] text-white">
      <Canvas camera={{ fov: 60, near: 0.1, far: 500 }} dpr={[1, 1.75]}>
        <color attach="background" args={["#030014"]} />
        {/* depth haze: keeps the current waypoint crisp, hides the next one */}
        <fog attach="fog" args={["#030014", 35, 130]} />
        <ambientLight intensity={0.28} />
        <directionalLight position={[8, 18, -60]} intensity={1.1} color="#eef2ff" />

        <ScrollControls pages={PAGES} damping={0.22}>
          <Rig />
          <ScrollBridge elRef={scrollElRef} />

          <Suspense fallback={null}>
            <Environment preset="city" />
            <SceneTuning />
            <Ship />
            <StarField />
            <LaunchEarth />
            <HeroMars />
            <IdeaNebula />
            <OrbitalForge />
            <DefenseGrid />
            <ModelSystem />
            <DestinationStar />
            <ScenePanels />
          </Suspense>

          <Scroll html>
            <Hud currency={currency} />
          </Scroll>
        </ScrollControls>

        <EffectComposer>
          {/* threshold above lit-white-hull luminance: only emissives, the sun
              and engine glow bloom — never the ship's paint */}
          <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.75} luminanceSmoothing={0.2} />
          <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} />
          <Noise opacity={0.05} />
          <Vignette offset={0.24} darkness={0.72} />
        </EffectComposer>
      </Canvas>

      {/* ——— fixed cockpit chrome ——— */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* corner frame */}
        <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-sky-500/40" />
        <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-sky-500/40" />
        <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-sky-500/40" />
        <div className="absolute right-4 bottom-4 h-8 w-8 border-r-2 border-b-2 border-sky-500/40" />

        {/* top bar: logo · nav · CTA */}
        <div className="absolute top-6 right-10 left-10 flex items-center justify-between">
          <a href="/" className="pointer-events-auto">
            <WyberLogo markSize={26} wordmarkSize={15} />
          </a>
          <nav className="pointer-events-auto hidden gap-7 font-mono text-[10px] tracking-[0.25em] uppercase lg:flex">
            {NAV.map((label, i) => (
              <button
                key={label}
                data-wy-nav
                onClick={() => jumpTo(i)}
                className="cursor-pointer border-none bg-transparent font-mono text-[10px] tracking-[0.25em] text-slate-400 uppercase transition hover:text-white"
              >
                {String(i + 1).padStart(2, "0")}. {label}
              </button>
            ))}
          </nav>
          <a
            href="/signup"
            className="pointer-events-auto rounded-full border border-sky-400/40 bg-sky-500/10 px-5 py-2 text-[13px] font-semibold text-sky-300 backdrop-blur-sm transition hover:bg-sky-500 hover:text-white"
          >
            Start building →
          </a>
        </div>

        {/* right telemetry rail */}
        <div className="absolute top-1/2 right-7 hidden -translate-y-1/2 flex-col items-center gap-5 md:flex">
          <div className="flex flex-col items-center gap-2.5">
            {NAV.map((label, i) => (
              <span key={label} data-wy-dot title={label} className="h-1.5 w-1.5 rounded-full bg-white/20 transition-all" />
            ))}
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase [writing-mode:vertical-rl]">
            <span>alt <span id="wy-alt" className="text-sky-400">00000</span> km</span>
            <span>vel <span id="wy-vel" className="text-sky-400">0.00</span> c</span>
            <span>sec <span id="wy-wp" className="text-sky-400">01</span>/06</span>
          </div>
        </div>

        {/* journey progress */}
        <div className="absolute bottom-6 left-1/2 h-0.5 w-56 -translate-x-1/2 overflow-hidden rounded bg-white/10">
          <div id="wy-progress" className="h-full w-full origin-left bg-sky-400" style={{ transform: "scaleX(0.005)" }} />
        </div>
      </div>
    </div>
  );
}
