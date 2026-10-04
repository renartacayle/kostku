import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import KostBuilding from './KostBuilding';
import CameraRig from './CameraRig';
import Character from './Character';

/* ──────────────────────────────────────────────
   KostScene — The full 3D world
   Assembles building + character + lights + sky
   inside a React Three Fiber Canvas.
   ────────────────────────────────────────────── */

export default function KostScene({ scrollProgress = 0 }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{
        fov: 50,
        near: 0.1,
        far: 200,
        position: [-4, 3, 18],
      }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Background is handled by CSS (hero image) */}

      {/* === Lighting Setup (Blue Hour) === */}

      {/* Main directional (key) — cool twilight blue from the left */}
      <directionalLight
        position={[-15, 12, 10]}
        intensity={0.8}
        color="#4466aa"
        castShadow={false}
      />

      {/* Secondary directional (fill from right) — last horizon glow */}
      <directionalLight
        position={[10, 8, -5]}
        intensity={0.3}
        color="#ffaa55"
      />

      {/* Ambient light — cool blue hour fill */}
      <ambientLight intensity={0.15} color="#334466" />

      {/* Rim light from behind */}
      <directionalLight
        position={[0, 6, -10]}
        intensity={0.2}
        color="#223355"
      />

      {/* Ground illumination — building spill light */}
      <pointLight
        position={[0, 0.5, 10]}
        intensity={1.5}
        color="#ffcc88"
        distance={15}
        decay={2}
      />

      {/* Lobby light spilling onto wet pavement near entrance */}
      <pointLight
        position={[0, 2, 5]}
        intensity={3}
        color="#ffdd99"
        distance={8}
        decay={2}
      />

      {/* === Scene Objects === */}

      {/* Ground plane (sidewalk / pavement) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 5]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#4a4540"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Ground planes removed to let the hero image show through completely */}

      {/* The Building (Hidden in Hybrid Approach - Using Hero Image) */}
      {/* <KostBuilding /> */}

      {/* The Character */}
      <Character scrollProgress={scrollProgress} />

      {/* Camera Controller */}
      <CameraRig scrollProgress={scrollProgress} />
    </Canvas>
  );
}
