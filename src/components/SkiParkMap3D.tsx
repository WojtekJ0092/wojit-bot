import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { type JSX, useMemo } from "react";
import * as THREE from "three";

function SnowMaterial() {
  return (
    <meshStandardMaterial
      color="#f5faff"
      roughness={0.78}
      metalness={0.03}
      emissive="#d8ecff"
      emissiveIntensity={0.05}
    />
  );
}

function SlopeBase(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 1.24, 0]} rotation={[-0.055, 0, 0]} receiveShadow>
        <boxGeometry args={[34, 0.5, 190]} />
        <SnowMaterial />
      </mesh>

      <mesh position={[0, 0.2, -31]} receiveShadow>
        <boxGeometry args={[30, 0.4, 22]} />
        <SnowMaterial />
      </mesh>
    </group>
  );
}

function Jump({ position, width = 3.6, length = 5.2, height = 1.15 }: {
  position: [number, number, number];
  width?: number;
  length?: number;
  height?: number;
}): JSX.Element {
  const [x, y, z] = position;

  return (
    <group>
      <mesh position={[x, y + height * 0.5, z]} castShadow receiveShadow>
        <boxGeometry args={[width, height, length]} />
        <SnowMaterial />
      </mesh>

      <mesh position={[x, y + height * 0.28, z - length * 0.55]} rotation={[0.18, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.62, length * 0.78]} />
        <SnowMaterial />
      </mesh>

      <mesh position={[x, y + height * 0.18, z + length * 0.52]} rotation={[-0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.45, length * 0.58]} />
        <SnowMaterial />
      </mesh>
    </group>
  );
}

function StraightRail({ position, length = 6.4, rotationY = 0, pitch = -0.055, height = 0.5 }: {
  position: [number, number, number];
  length?: number;
  rotationY?: number;
  pitch?: number;
  height?: number;
}): JSX.Element {
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} rotation={[pitch, rotationY, 0]}>
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[0.14, 0.14, length]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>

      <mesh position={[0, height * 0.5, -length * 0.48]} castShadow>
        <boxGeometry args={[0.14, height, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, height * 0.5, length * 0.48]} castShadow>
        <boxGeometry args={[0.14, height, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function KinkedRail({ position, rotationY = 0, pitch = -0.055, height = 0.55 }: {
  position: [number, number, number];
  rotationY?: number;
  pitch?: number;
  height?: number;
}): JSX.Element {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[pitch, rotationY, 0]}>
      <mesh position={[0, height - 0.08, -2.45]} rotation={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[0.14, 0.14, 3.4]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>
      <mesh position={[0, height + 0.04, 0.4]} rotation={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[0.14, 0.14, 2.8]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>
      <mesh position={[0, height * 0.5, -4.05]} castShadow>
        <boxGeometry args={[0.14, height, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, height * 0.5, 2.25]} castShadow>
        <boxGeometry args={[0.14, height, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RainbowRail({ position, rotationY = 0, pitch = -0.055, height = 0.6 }: {
  position: [number, number, number];
  rotationY?: number;
  pitch?: number;
  height?: number;
}): JSX.Element {
  const [x, y, z] = position;
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -3.4),
        new THREE.Vector3(0, 0.7, -1.8),
        new THREE.Vector3(0, 1.05, 0),
        new THREE.Vector3(0, 0.7, 1.8),
        new THREE.Vector3(0, 0, 3.4),
      ]),
    [],
  );

  return (
    <group position={[x, y + height, z]} rotation={[pitch, rotationY, 0]}>
      <mesh castShadow>
        <tubeGeometry args={[curve, 46, 0.09, 14, false]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>
      <mesh position={[0, -height * 0.45, -3.4]} castShadow>
        <boxGeometry args={[0.14, height, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, -height * 0.45, 3.4]} castShadow>
        <boxGeometry args={[0.14, height, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function FlatBox({ position, length = 5.0, width = 0.55, height = 0.52, rotationY = 0, pitch = -0.055 }: {
  position: [number, number, number];
  length?: number;
  width?: number;
  height?: number;
  rotationY?: number;
  pitch?: number;
}): JSX.Element {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[pitch, rotationY, 0]}>
      <mesh position={[0, height * 0.5, 0]} castShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color="#dbe7f3" metalness={0.48} roughness={0.36} />
      </mesh>
      <mesh position={[0, height + 0.03, 0]} castShadow>
        <boxGeometry args={[width + 0.02, 0.06, length]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>
      <mesh position={[0, height * 0.25, -length * 0.46]} castShadow>
        <boxGeometry args={[0.14, height * 0.5, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, height * 0.25, length * 0.46]} castShadow>
        <boxGeometry args={[0.14, height * 0.5, 0.14]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RailKicker({ position, rotationY = 0, pitch = -0.055, width = 2.8, length = 2.6, height = 0.42 }: {
  position: [number, number, number];
  rotationY?: number;
  pitch?: number;
  width?: number;
  length?: number;
  height?: number;
}): JSX.Element {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[pitch, rotationY, 0]}>
      <mesh position={[0, height * 0.35, -length * 0.22]} rotation={[0.22, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.7, length * 0.8]} />
        <SnowMaterial />
      </mesh>
      <mesh position={[0, height * 0.18, length * 0.34]} rotation={[-0.06, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.45, length * 0.7]} />
        <SnowMaterial />
      </mesh>
    </group>
  );
}

function LandingBank({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }): JSX.Element {
  const [x, y, z] = position;
  return (
    <mesh position={[x, y, z]} rotation={[0.2, rotationY, 0]} castShadow receiveShadow>
      <boxGeometry args={[3.8, 0.8, 6.3]} />
      <SnowMaterial />
    </mesh>
  );
}

function ParkLayout(): JSX.Element {
  const skyColor = useMemo(() => new THREE.Color("#d7ebff"), []);
  const railSlopeY = (z: number) => 1.24 + 0.054 * z;

  return (
    <group>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={["#d7ebff", 24, 95]} />

      <ambientLight intensity={0.78} />
      <directionalLight
        position={[8, 16, 11]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <SlopeBase />

      {/* Rail line (left lane) */}
      <RailKicker position={[-6.4, railSlopeY(-20.2), -20.2]} />
      <StraightRail position={[-6.4, railSlopeY(-17.0), -17.0]} length={6.4} rotationY={0.0} />
      <RailKicker position={[-6.35, railSlopeY(-8.9), -8.9]} />
      <KinkedRail position={[-6.35, railSlopeY(-5.5), -5.5]} rotationY={0.0} />
      <RailKicker position={[-6.3, railSlopeY(2.4), 2.4]} />
      <RainbowRail position={[-6.3, railSlopeY(6.2), 6.2]} rotationY={0.0} />
      <RailKicker position={[-6.35, railSlopeY(14.1), 14.1]} />
      <FlatBox position={[-6.35, railSlopeY(17.8), 17.8]} length={5.9} rotationY={0.0} />

      {/* Jump line (right lane) */}
      <Jump position={[6.3, 0.48, -16.0]} width={4.0} length={5.3} height={0.92} />
      <Jump position={[6.25, 1.08, -4.4]} width={4.1} length={5.6} height={1.0} />
      <Jump position={[6.2, 1.8, 7.2]} width={4.2} length={5.9} height={1.1} />
      <Jump position={[6.25, 2.62, 19.0]} width={4.35} length={6.2} height={1.2} />

      <LandingBank position={[-6.3, 1.14, 0.5]} rotationY={0.0} />
      <LandingBank position={[6.25, 1.34, 0.8]} rotationY={0.0} />
      <LandingBank position={[-6.35, 2.45, 22.8]} rotationY={0.0} />
      <LandingBank position={[6.25, 3.1, 24.0]} rotationY={0.0} />
    </group>
  );
}

export function SkiParkMap3D() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 12, 34], fov: 48, near: 0.1, far: 400 }}
      className="gate-game__canvas"
    >
      <ParkLayout />
      <OrbitControls
        enablePan={false}
        minDistance={16}
        maxDistance={62}
        minPolarAngle={0.58}
        maxPolarAngle={1.16}
        target={[0, 0.9, 6]}
      />
    </Canvas>
  );
}
