import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

/* ──────────────────────────────────────────────
   Procedural Multi-Story Kost Building
   Indonesian Authenticity Update (Blue Hour)
   ────────────────────────────────────────────── */

// 2700K Warm White equivalent
const WARM_WHITE = "#ffcca8";
const TEAK_WOOD = "#A0722A";
const CONCRETE = "#9a9590";

// Reusable window component
function Window({ position, width = 0.9, height = 1.2, emissiveIntensity = 0.6 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, 0.05]} />
      <meshStandardMaterial
        color="#ffeebb"
        emissive={WARM_WHITE}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={0.85}
        roughness={0.1}
        metalness={0.3}
      />
    </mesh>
  );
}

// Teak Wood Louvers (Kisi-kisi)
function TeakLouvers({ position, width = 0.9, height = 1.2 }) {
  const slatHeight = 0.04;
  const gap = 0.04;
  const numSlats = Math.floor(height / (slatHeight + gap));
  const slats = [];
  for (let i = 0; i < numSlats; i++) {
    slats.push(
      <mesh key={i} position={[0, height / 2 - slatHeight / 2 - i * (slatHeight + gap), 0.02]}>
        <boxGeometry args={[width - 0.04, slatHeight, 0.02]} />
        <meshStandardMaterial color={TEAK_WOOD} roughness={0.7} metalness={0.1} />
      </mesh>
    );
  }
  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.8} />
      </mesh>
      {/* Back panel to block some light or act as a dark void */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[width - 0.02, height - 0.02, 0.01]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      {slats}
    </group>
  );
}

// Roster (Breeze Blocks)
function RosterPanel({ position, width = 1.2, height = 2.4 }) {
  const cols = 5;
  const rows = 10;
  const bw = (width - (cols + 1) * 0.04) / cols;
  const bh = (height - (rows + 1) * 0.04) / rows;
  const bd = 0.1;
  const boxes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      boxes.push(
        <mesh key={`${r}-${c}`} position={[
          -width / 2 + 0.04 + bw / 2 + c * (bw + 0.04),
          height / 2 - 0.04 - bh / 2 - r * (bh + 0.04),
          0
        ]}>
          <boxGeometry args={[bw, bh, bd]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.9} />
        </mesh>
      );
    }
  }
  return (
    <group position={position}>
      {/* Outer Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, bd - 0.02]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.9} />
      </mesh>
      {boxes}
    </group>
  );
}

// Authentic Tropical Plants
function Fern({ position }) {
  return (
    <group position={position}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 4, (i * Math.PI * 2) / 6, 0]} position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.01, 0.04, 0.5, 5]} />
          <meshStandardMaterial color="#2d8a4e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Monstera({ position }) {
  return (
    <group position={position}>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 5 + Math.random() * 0.5;
        return (
          <mesh key={i} rotation={[Math.PI / 6, angle, 0]} position={[Math.cos(angle) * 0.15, 0.2, Math.sin(angle) * 0.15]}>
            <planeGeometry args={[0.35, 0.35]} />
            <meshStandardMaterial color="#1d6a3e" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

function TrailingVine({ position }) {
  return (
    <group position={position}>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i * 0.8) * 0.05, -i * 0.12, Math.cos(i * 0.8) * 0.05]} rotation={[0, 0, Math.sin(i) * 0.2]}>
          <cylinderGeometry args={[0.02, 0.01, 0.15, 4]} />
          <meshStandardMaterial color="#3aad5b" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Rattan Pendant Light
function RattanPendant({ position }) {
  return (
    <group position={position}>
      {/* Wire */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.7]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Rattan Weave Sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.25, 16, 12]} />
        <meshStandardMaterial color="#B8860B" wireframe transparent opacity={0.5} roughness={0.8} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#fff" emissive={WARM_WHITE} emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0, 0, 0]} color={WARM_WHITE} intensity={1.5} distance={6} />
    </group>
  );
}

// Balcony with trailing vines
function Balcony({ position }) {
  return (
    <group position={position}>
      {/* Balcony floor */}
      <mesh position={[0, -0.6, 0.6]}>
        <boxGeometry args={[1.8, 0.08, 1.0]} />
        <meshStandardMaterial color="#555555" roughness={0.8} />
      </mesh>
      {/* Railing */}
      <mesh position={[0, -0.25, 1.05]}>
        <boxGeometry args={[1.8, 0.6, 0.04]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} transparent opacity={0.5} />
      </mesh>
      {/* Trailing Vine Plants */}
      <TrailingVine position={[0.6, -0.2, 1.08]} />
      <TrailingVine position={[-0.7, -0.2, 1.08]} />
    </group>
  );
}

// Floor section (one storey of the building)
function Floor({ yOffset, floorIndex, buildingWidth = 10, floorHeight = 3.2, depth = 6 }) {
  const windowCount = 4;
  const windowSpacing = buildingWidth / (windowCount + 1);
  const isGround = floorIndex === 0;

  return (
    <group position={[0, yOffset, 0]}>
      {/* Main wall */}
      <mesh position={[0, floorHeight / 2, 0]}>
        <boxGeometry args={[buildingWidth, floorHeight, depth]} />
        <meshStandardMaterial
          color={isGround ? '#8a8580' : CONCRETE}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Tritisan (Deep Overhang) - Floor separator line */}
      <mesh position={[0, floorHeight + 0.05, depth / 2 + 1.5 / 2]}>
        <boxGeometry args={[buildingWidth + 0.2, 0.1, 1.5]} />
        <meshStandardMaterial color="#5a5650" roughness={0.6} />
      </mesh>

      {/* Windows and Louvers */}
      {Array.from({ length: windowCount }).map((_, i) => {
        const x = -buildingWidth / 2 + windowSpacing * (i + 1);
        const y = floorHeight / 2 + 0.2;
        const z = depth / 2 + 0.03;
        const intensity = 0.3 + Math.random() * 0.5;

        // Replace some windows with Teak Louvers
        const useLouvers = !isGround && i % 2 !== 0;

        return (
          <group key={`win-${floorIndex}-${i}`}>
            {useLouvers ? (
              <TeakLouvers position={[x, y, z]} width={0.9} height={1.3} />
            ) : (
              <>
                <Window
                  position={[x, y, z]}
                  width={isGround && i >= 1 && i <= 2 ? 1.8 : 0.9}
                  height={isGround ? 2.2 : 1.2}
                  emissiveIntensity={intensity}
                />
                {/* Window frame */}
                <mesh position={[x, y, z + 0.01]}>
                  <boxGeometry args={[
                    (isGround && i >= 1 && i <= 2 ? 1.9 : 1.0),
                    (isGround ? 2.3 : 1.3),
                    0.02
                  ]} />
                  <meshStandardMaterial color="#3a3530" roughness={0.5} />
                </mesh>
              </>
            )}

            {/* Balconies on upper floors */}
            {!isGround && i % 2 === 0 && (
              <Balcony position={[x, y, z]} />
            )}
          </group>
        );
      })}

      {/* Ground floor entrance */}
      {isGround && (
        <group>
          {/* Entrance opening */}
          <mesh position={[0, 1.4, depth / 2 + 0.04]}>
            <boxGeometry args={[2.8, 2.8, 0.06]} />
            <meshStandardMaterial
              color="#ffeedd"
              emissive={WARM_WHITE}
              emissiveIntensity={0.6}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Entrance frame */}
          <mesh position={[0, 1.4, depth / 2 + 0.06]}>
            <boxGeometry args={[3.0, 3.0, 0.03]} />
            <meshStandardMaterial color={TEAK_WOOD} roughness={0.5} metalness={0.1} />
          </mesh>
          {/* Rattan Pendant Lights inside Lobby */}
          <RattanPendant position={[-0.8, 2.3, depth / 2 - 0.5]} />
          <RattanPendant position={[0.8, 2.3, depth / 2 - 0.5]} />
        </group>
      )}

      {/* Roster (Breeze Blocks) on side panels */}
      {!isGround && (
        <>
          <RosterPanel position={[buildingWidth / 2 - 0.7, floorHeight / 2, depth / 2 + 0.05]} />
          <RosterPanel position={[-buildingWidth / 2 + 0.7, floorHeight / 2, depth / 2 + 0.05]} />
        </>
      )}
    </group>
  );
}

export default function KostBuilding() {
  const floors = 3;
  const floorHeight = 3.2;
  const buildingWidth = 10;
  const depth = 6;

  return (
    <group position={[0, 0, 0]}>
      {/* Damp Pavement Effect for Blue Hour */}
      <mesh position={[0, -0.14, depth / 2 + 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[buildingWidth + 8, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Foundation / base */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[buildingWidth + 1, 0.3, depth + 1]} />
        <meshStandardMaterial color="#555045" roughness={0.9} />
      </mesh>

      {/* Floors */}
      {Array.from({ length: floors }).map((_, i) => (
        <Floor
          key={`floor-${i}`}
          yOffset={i * floorHeight}
          floorIndex={i}
          buildingWidth={buildingWidth}
          floorHeight={floorHeight}
          depth={depth}
        />
      ))}

      {/* Roof */}
      <mesh position={[0, floors * floorHeight + 0.2, 0]}>
        <boxGeometry args={[buildingWidth + 0.6, 0.4, depth + 0.6]} />
        <meshStandardMaterial color="#444038" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Roof accent */}
      <mesh position={[0, floors * floorHeight + 0.5, 0]}>
        <boxGeometry args={[buildingWidth - 2, 0.15, depth - 1]} />
        <meshStandardMaterial color="#666050" roughness={0.6} />
      </mesh>

      {/* Building sign — "TAMAN SUKUN" */}
      <mesh position={[0, 0.5, depth / 2 + 0.1]} rotation={[0, 0, 0]}>
        <boxGeometry args={[4.5, 0.8, 0.15]} />
        <meshStandardMaterial
          color="#2a2218"
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
      {/* Sign glow */}
      <mesh position={[0, 0.5, depth / 2 + 0.2]}>
        <boxGeometry args={[4.2, 0.55, 0.02]} />
        <meshStandardMaterial
          color={WARM_WHITE}
          emissive={WARM_WHITE}
          emissiveIntensity={1.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Street lamp (left) */}
      <group position={[-6, 0, depth / 2 + 2]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 4, 6]} />
          <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 4.2, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial
            color="#ffeecc"
            emissive={WARM_WHITE}
            emissiveIntensity={2}
          />
        </mesh>
        <pointLight position={[0, 4.2, 0]} intensity={3} color={WARM_WHITE} distance={10} decay={2} />
      </group>

      {/* Bike rack */}
      <group position={[-4, 0, depth / 2 + 2.5]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={`rack-${i}`} position={[i * 0.5, 0.4, 0]}>
            <torusGeometry args={[0.3, 0.02, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#777" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0.75, 0.05, 0]}>
          <boxGeometry args={[2.2, 0.08, 0.3]} />
          <meshStandardMaterial color="#666" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Landscaping — Authentic Tropical Plants */}
      <Fern position={[3.5, -0.1, depth / 2 + 1.5]} />
      <Monstera position={[4.5, -0.1, depth / 2 + 2.2]} />
      <Fern position={[-2.5, -0.1, depth / 2 + 2.2]} />
      <Monstera position={[5.5, -0.1, depth / 2 + 1]} />

      {/* Small trees */}
      {[[6, 0, depth / 2 + 3], [-6.5, 0, depth / 2 + 3]].map((pos, i) => (
        <group key={`tree-${i}`} position={pos}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 2.4, 6]} />
            <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#2d7a3e" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
