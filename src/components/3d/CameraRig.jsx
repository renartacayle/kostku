import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ──────────────────────────────────────────────
   Scroll-Driven Camera Rig
   Reads a normalized scroll progress (0–1)
   and smoothly interpolates camera position
   along a cinematic orbital path.
   ────────────────────────────────────────────── */

export default function CameraRig({ scrollProgress = 0 }) {
  const groupRef = useRef();

  // Precompute path keyframes
  const keyframes = {
    // Phase 1: Behind the character, wide shot
    start: {
      pos: new THREE.Vector3(-4, 3, 18),
      target: new THREE.Vector3(0, 5, 0),
    },
    // Phase 2: Orbital pan to center
    mid1: {
      pos: new THREE.Vector3(0, 4, 16),
      target: new THREE.Vector3(0, 4.5, 0),
    },
    // Phase 3: Zoom in toward entrance
    mid2: {
      pos: new THREE.Vector3(1, 3, 12),
      target: new THREE.Vector3(0, 3, 0),
    },
    // Phase 4: Looking up at the building
    end: {
      pos: new THREE.Vector3(0.5, 2, 9),
      target: new THREE.Vector3(0, 6, 0),
    },
  };

  useFrame(({ camera }) => {
    const t = scrollProgress;
    let pos, target;

    if (t < 0.33) {
      // Phase 1 → 2
      const p = t / 0.33;
      pos = new THREE.Vector3().lerpVectors(keyframes.start.pos, keyframes.mid1.pos, p);
      target = new THREE.Vector3().lerpVectors(keyframes.start.target, keyframes.mid1.target, p);
    } else if (t < 0.66) {
      // Phase 2 → 3
      const p = (t - 0.33) / 0.33;
      pos = new THREE.Vector3().lerpVectors(keyframes.mid1.pos, keyframes.mid2.pos, p);
      target = new THREE.Vector3().lerpVectors(keyframes.mid1.target, keyframes.mid2.target, p);
    } else {
      // Phase 3 → 4
      const p = (t - 0.66) / 0.34;
      pos = new THREE.Vector3().lerpVectors(keyframes.mid2.pos, keyframes.end.pos, p);
      target = new THREE.Vector3().lerpVectors(keyframes.mid2.target, keyframes.end.target, p);
    }

    // Smooth damp for buttery camera motion
    camera.position.lerp(pos, 0.08);
    
    const currentTarget = new THREE.Vector3();
    camera.getWorldDirection(currentTarget);
    const desiredDir = target.clone().sub(camera.position).normalize();
    const smoothedDir = currentTarget.lerp(desiredDir, 0.06);
    const lookAtPoint = camera.position.clone().add(smoothedDir.multiplyScalar(10));
    camera.lookAt(lookAtPoint);
  });

  return null;
}
