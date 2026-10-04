import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ──────────────────────────────────────────────
   Character — Stylized Low-Poly Figure
   A simple geometric figure made from primitives:
   body, head, arms, legs, backpack.
   Animates a subtle walk cycle as scroll progresses.
   ────────────────────────────────────────────── */

export default function Character({ scrollProgress = 0 }) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  // Skin + clothing colors
  const skinColor = '#d4a574';
  const shirtColor = '#3a6b8a';
  const pantsColor = '#4a4a42';
  const shoeColor = '#2a2218';
  const hairColor = '#1a1008';
  const backpackColor = '#8a7a5a';

  // Walk animation + forward movement
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = scrollProgress;
    
    // Forward movement (z decreases toward building)
    const startZ = 12;
    const endZ = 6;
    const walkProgress = Math.min(t * 2, 1); // walks during first 50% of scroll
    groupRef.current.position.z = THREE.MathUtils.lerp(startZ, endZ, walkProgress);
    groupRef.current.position.x = THREE.MathUtils.lerp(-0.5, 0, walkProgress);

    // Walk cycle (oscillating legs + arms)
    const isWalking = t > 0.05 && t < 0.55;
    const walkSpeed = isWalking ? clock.getElapsedTime() * 4 : 0;
    const swing = isWalking ? Math.sin(walkSpeed) * 0.4 : 0;

    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;

    // Subtle body bob
    groupRef.current.position.y = isWalking ? Math.abs(Math.sin(walkSpeed * 2)) * 0.05 : 0;
  });

  return (
    <group ref={groupRef} position={[-0.5, 0, 12]} rotation={[0, Math.PI, 0]}>
      {/* --- Body (torso) --- */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshStandardMaterial color={shirtColor} roughness={0.8} />
      </mesh>

      {/* --- Head --- */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.95, -0.05]}>
        <sphereGeometry args={[0.23, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>

      {/* --- Left Arm --- */}
      <group ref={leftArmRef} position={[0.38, 1.4, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.14, 0.55, 0.14]} />
          <meshStandardMaterial color={shirtColor} roughness={0.8} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
      </group>

      {/* --- Right Arm --- */}
      <group ref={rightArmRef} position={[-0.38, 1.4, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.14, 0.55, 0.14]} />
          <meshStandardMaterial color={shirtColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
      </group>

      {/* --- Left Leg --- */}
      <group ref={leftLegRef} position={[0.14, 0.75, 0]}>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.72, 0.04]}>
          <boxGeometry args={[0.18, 0.08, 0.26]} />
          <meshStandardMaterial color={shoeColor} roughness={0.6} />
        </mesh>
      </group>

      {/* --- Right Leg --- */}
      <group ref={rightLegRef} position={[-0.14, 0.75, 0]}>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.72, 0.04]}>
          <boxGeometry args={[0.18, 0.08, 0.26]} />
          <meshStandardMaterial color={shoeColor} roughness={0.6} />
        </mesh>
      </group>

      {/* --- Backpack --- */}
      <mesh position={[0, 1.15, -0.22]}>
        <boxGeometry args={[0.4, 0.5, 0.2]} />
        <meshStandardMaterial color={backpackColor} roughness={0.7} />
      </mesh>
      {/* Backpack strap */}
      <mesh position={[0.15, 1.35, -0.08]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color={backpackColor} roughness={0.7} />
      </mesh>
      <mesh position={[-0.15, 1.35, -0.08]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color={backpackColor} roughness={0.7} />
      </mesh>
    </group>
  );
}
