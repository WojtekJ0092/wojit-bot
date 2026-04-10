import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { type JSX, type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import skiBackdropUrl from "../assets/ski-backdrop.jpg";

const PARK_SCALE = 0.6;
const FEATURE_SCALE = 1.3;
const SLOPE_PITCH = -0.055;
const SLOPE_SURFACE_Y_AT_ZERO = 1.49;
const SLOPE_Y_PER_Z = 0.055;

const slopeSurfaceY = (z: number) => SLOPE_SURFACE_Y_AT_ZERO + SLOPE_Y_PER_Z * z;

function BackgroundDome(): JSX.Element {
  const skyboxRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const sideTexture = useTexture(skiBackdropUrl);

  sideTexture.colorSpace = THREE.SRGBColorSpace;
  sideTexture.wrapS = THREE.RepeatWrapping;
  sideTexture.wrapT = THREE.ClampToEdgeWrapping;
  sideTexture.repeat.set(1, 1);
  sideTexture.offset.set(0.125, 0);
  sideTexture.minFilter = THREE.LinearMipmapLinearFilter;
  sideTexture.magFilter = THREE.LinearFilter;

  const skyTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      const fallback = new THREE.Texture();
      fallback.colorSpace = THREE.SRGBColorSpace;
      return fallback;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#77b8ff");
    grad.addColorStop(0.35, "#b9dcff");
    grad.addColorStop(0.72, "#e6f4ff");
    grad.addColorStop(1, "#f7fbff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  const groundTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      const fallback = new THREE.Texture();
      fallback.colorSpace = THREE.SRGBColorSpace;
      return fallback;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#ecf7ff");
    grad.addColorStop(0.55, "#dcedfb");
    grad.addColorStop(1, "#c8deef");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Light texture noise to avoid a flat look.
    for (let i = 0; i < 1800; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.4 + 0.4;
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  useFrame(() => {
    if (skyboxRef.current) {
      // Keep the skybox centered on the camera so it is always visible.
      skyboxRef.current.position.copy(camera.position);
    }
  });

  return (
    <mesh ref={skyboxRef} frustumCulled={false} renderOrder={-1000} rotation={[0, Math.PI * 0.25, 0]}>
      <boxGeometry args={[980, 980, 980]} />
      <meshBasicMaterial attach="material-0" map={sideTexture} side={THREE.BackSide} toneMapped={false} depthWrite={false} fog={false} />
      <meshBasicMaterial attach="material-1" map={sideTexture} side={THREE.BackSide} toneMapped={false} depthWrite={false} fog={false} />
      <meshBasicMaterial attach="material-2" map={skyTexture} side={THREE.BackSide} toneMapped={false} depthWrite={false} fog={false} />
      <meshBasicMaterial attach="material-3" map={groundTexture} side={THREE.BackSide} toneMapped={false} depthWrite={false} fog={false} />
      <meshBasicMaterial attach="material-4" map={sideTexture} side={THREE.BackSide} toneMapped={false} depthWrite={false} fog={false} />
      <meshBasicMaterial attach="material-5" map={sideTexture} side={THREE.BackSide} toneMapped={false} depthWrite={false} fog={false} />
    </mesh>
  );
}

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
    <mesh position={[0, 1.24, 0]} rotation={[SLOPE_PITCH, 0, 0]} receiveShadow>
      <boxGeometry args={[34, 0.5, 570]} />
      <SnowMaterial />
    </mesh>
  );
}

function StraightRail({ position, length = 6.4, rotationY = 0, pitch = -0.055, height = 0.5, railRadius = 0.075, scale = 1 }: {
  position: [number, number, number];
  length?: number;
  rotationY?: number;
  pitch?: number;
  height?: number;
  railRadius?: number;
  scale?: number;
}): JSX.Element {
  const [x, y, z] = position;
  const supportRadius = Math.max(0.06, railRadius * 0.8);

  return (
    <group position={[x, y, z]} rotation={[pitch, rotationY, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, height, 0]} rotation={[Math.PI * 0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[railRadius, railRadius, length, 18]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>

      <mesh position={[0, height * 0.5, -length * 0.48]} castShadow>
        <cylinderGeometry args={[supportRadius, supportRadius, height, 12]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>
      <mesh position={[0, height * 0.5, length * 0.48]} castShadow>
        <cylinderGeometry args={[supportRadius, supportRadius, height, 12]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RainbowRail({ position, rotationY = 0, pitch = -0.055, height = 0.5, scale = 1 }: {
  position: [number, number, number];
  rotationY?: number;
  pitch?: number;
  height?: number;
  scale?: number;
}): JSX.Element {
  const [x, y, z] = position;
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -3.2),
        new THREE.Vector3(0, 0.5, -1.3),
        new THREE.Vector3(0, 0.72, 0),
        new THREE.Vector3(0, 0.5, 1.3),
        new THREE.Vector3(0, 0, 3.2),
      ]),
    [],
  );

  return (
    <group position={[x, y + height, z]} rotation={[pitch, rotationY, 0]} scale={[scale, scale, scale]}>
      <mesh castShadow>
        <tubeGeometry args={[curve, 56, 0.075, 18, false]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>

      <mesh position={[0, -height * 0.5, -3.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, height, 12]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, -height * 0.5, 3.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, height, 12]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function KinkedRail({ position, rotationY = 0, pitch = -0.055, height = 0.55, scale = 1 }: {
  position: [number, number, number];
  rotationY?: number;
  pitch?: number;
  height?: number;
  scale?: number;
}): JSX.Element {
  const [x, y, z] = position;
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -3.4),
        new THREE.Vector3(0, 0, -1.2),
        new THREE.Vector3(0, 0.24, 0.4),
        new THREE.Vector3(0, 0.3, 3.1),
      ]),
    [],
  );

  return (
    <group position={[x, y + height, z]} rotation={[pitch, rotationY, 0]} scale={[scale, scale, scale]}>
      <mesh castShadow>
        <tubeGeometry args={[curve, 48, 0.075, 16, false]} />
        <meshStandardMaterial color="#8ea5bd" metalness={0.74} roughness={0.28} />
      </mesh>

      <mesh position={[0, -height * 0.5, -3.4]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, height, 12]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, -height * 0.35, 3.1]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, height * 0.75, 12]} />
        <meshStandardMaterial color="#9aaec4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RailKicker({ position, rotationY = 0, pitch = -0.055, width = 2.8, length = 2.6, height = 0.42, scale = 1 }: {
  position: [number, number, number];
  rotationY?: number;
  pitch?: number;
  width?: number;
  length?: number;
  height?: number;
  scale?: number;
}): JSX.Element {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[pitch, rotationY, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, height * 0.24, 0]} rotation={[0.16, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.9, length]} />
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

function SkierCharacter({ skierRef }: { skierRef: MutableRefObject<THREE.Group | null> }): JSX.Element {
  const keyStateRef = useRef({ left: false, right: false, up: false, down: false, jump: false });
  const speedRef = useRef(16);
  const velocityYRef = useRef(0);
  const groundedRef = useRef(true);
  const jumpLatchRef = useRef(false);
  const positionRef = useRef(new THREE.Vector3(-6.4, 0, 135));
  const onRailRef = useRef(false);
  const railIndexRef = useRef(-1);
  const railYawSignRef = useRef(1);

  const riderBaseHeight = 0.52;
  const railRideLift = 0.72;
  const steerVisualRef = useRef(0);

  const railColliders = useMemo(
    () => [
      { x: -6.4, z: -170.0, halfLength: 3.2 * FEATURE_SCALE, collisionRadius: 0.25 * FEATURE_SCALE },
      { x: -6.4, z: -120.0, halfLength: 3.6 * FEATURE_SCALE, collisionRadius: 0.34 * FEATURE_SCALE },
      { x: -6.4, z: -70.0, halfLength: 3.4 * FEATURE_SCALE, collisionRadius: 0.27 * FEATURE_SCALE },
      { x: -6.4, z: -20.0, halfLength: 3.4 * FEATURE_SCALE, collisionRadius: 0.28 * FEATURE_SCALE },
    ],
    [],
  );

  useEffect(() => {
    const shouldIgnoreKeyEvent = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();
      return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyEvent(event.target)) {
        return;
      }

      switch (event.code) {
        case "ArrowLeft":
          keyStateRef.current.left = true;
          event.preventDefault();
          break;
        case "ArrowRight":
          keyStateRef.current.right = true;
          event.preventDefault();
          break;
        case "ArrowUp":
          keyStateRef.current.up = true;
          event.preventDefault();
          break;
        case "ArrowDown":
          keyStateRef.current.down = true;
          event.preventDefault();
          break;
        case "Space":
          keyStateRef.current.jump = true;
          event.preventDefault();
          break;
        default:
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowLeft":
          keyStateRef.current.left = false;
          break;
        case "ArrowRight":
          keyStateRef.current.right = false;
          break;
        case "ArrowUp":
          keyStateRef.current.up = false;
          break;
        case "ArrowDown":
          keyStateRef.current.down = false;
          break;
        case "Space":
          keyStateRef.current.jump = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = keyStateRef.current;
    const position = positionRef.current;

    const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const throttle = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);

    speedRef.current = THREE.MathUtils.clamp(speedRef.current + throttle * 12 * dt, 10, 30);
    position.z -= speedRef.current * dt;
    position.x += steer * 8.5 * dt;
    position.x = THREE.MathUtils.clamp(position.x, -14.5, 14.5);

    if (keys.jump && groundedRef.current && !jumpLatchRef.current) {
      velocityYRef.current = 6.8;
      groundedRef.current = false;
      jumpLatchRef.current = true;
    }
    if (!keys.jump) {
      jumpLatchRef.current = false;
    }

    const groundY = slopeSurfaceY(position.z) + riderBaseHeight;

    // Keep the ride smooth by sticking to slope while grounded.
    if (groundedRef.current) {
      position.y = groundY;
      velocityYRef.current = 0;
    } else {
      velocityYRef.current -= 14 * dt;
      position.y += velocityYRef.current * dt;

      if (position.y <= groundY + 0.03) {
        position.y = groundY;
        velocityYRef.current = 0;
        groundedRef.current = true;
      }
    }

    // Keep rails solid: if rider intersects a rail while not in a high jump, push sideways off the tube.
    const skierHalfWidth = 0.24;
    if (!onRailRef.current) {
      for (let i = 0; i < railColliders.length; i += 1) {
        const collider = railColliders[i];
        if (!collider) {
          continue;
        }
        if (Math.abs(position.z - collider.z) > collider.halfLength + 0.28) {
          continue;
        }

        const dx = position.x - collider.x;
        const overlap = collider.collisionRadius + skierHalfWidth - Math.abs(dx);
        const isLowAir = position.y <= slopeSurfaceY(position.z) + riderBaseHeight + 0.45;

        if (overlap > 0 && isLowAir) {
          onRailRef.current = true;
          railIndexRef.current = i;
          railYawSignRef.current = steer === 0 ? railYawSignRef.current : Math.sign(steer);
          groundedRef.current = true;
          velocityYRef.current = 0;
          break;
        }
      }
    }

    if (onRailRef.current && railIndexRef.current >= 0) {
      const activeRail = railColliders[railIndexRef.current];
      if (!activeRail) {
        onRailRef.current = false;
        railIndexRef.current = -1;
      } else {
      position.x = THREE.MathUtils.damp(position.x, activeRail.x, 30, dt);
      // Keep skier centered and lifted to the rail top so skis do not ride under the tube.
      position.y = slopeSurfaceY(position.z) + riderBaseHeight + railRideLift;

      if (Math.abs(position.z - activeRail.z) > activeRail.halfLength + 0.3) {
        onRailRef.current = false;
        railIndexRef.current = -1;
      }
      }
    }
    position.x = THREE.MathUtils.clamp(position.x, -14.5, 14.5);

    // Loop the skier back to the top section once the run is completed.
    if (position.z < -250) {
      position.set(-6.4, slopeSurfaceY(150) + riderBaseHeight, 150);
      velocityYRef.current = 0;
      groundedRef.current = true;
      jumpLatchRef.current = false;
      onRailRef.current = false;
      railIndexRef.current = -1;
    }

    if (skierRef.current) {
      skierRef.current.position.copy(position);
      steerVisualRef.current = THREE.MathUtils.damp(steerVisualRef.current, steer, 10, dt);
      const yaw = onRailRef.current ? railYawSignRef.current * Math.PI * 0.5 : steerVisualRef.current * 0.25;
      const roll = onRailRef.current ? 0 : -steerVisualRef.current * 0.2;
      skierRef.current.rotation.set(-0.055, yaw, roll);
    }
  });

  return (
    <group ref={skierRef} position={[-6.4, slopeSurfaceY(135) + riderBaseHeight, 135]}>
      <mesh position={[-0.24, -0.46, 0]} castShadow>
        <boxGeometry args={[0.13, 0.045, 1.95]} />
        <meshStandardMaterial color="#be123c" roughness={0.5} metalness={0.12} />
      </mesh>
      <mesh position={[0.24, -0.46, 0]} castShadow>
        <boxGeometry args={[0.13, 0.045, 1.95]} />
        <meshStandardMaterial color="#be123c" roughness={0.5} metalness={0.12} />
      </mesh>
      <mesh position={[-0.24, -0.46, -0.93]} rotation={[Math.PI * 0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.01, 0.2, 14]} />
        <meshStandardMaterial color="#e11d48" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0.24, -0.46, -0.93]} rotation={[Math.PI * 0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.01, 0.2, 14]} />
        <meshStandardMaterial color="#e11d48" roughness={0.5} metalness={0.1} />
      </mesh>

      <mesh position={[-0.22, -0.42, -0.14]} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.32]} />
        <meshStandardMaterial color="#111827" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh position={[0.22, -0.42, -0.14]} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.32]} />
        <meshStandardMaterial color="#111827" roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[-0.12, -0.14, 0.04]} rotation={[0.22, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 6, 10]} />
        <meshStandardMaterial color="#d6c9b0" roughness={0.82} metalness={0.05} />
      </mesh>
      <mesh position={[0.12, -0.14, 0.04]} rotation={[0.22, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 6, 10]} />
        <meshStandardMaterial color="#d6c9b0" roughness={0.82} metalness={0.05} />
      </mesh>

      <mesh position={[0, 0.06, 0.03]} castShadow>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.68} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.2, 0.03]} castShadow>
        <capsuleGeometry args={[0.23, 0.9, 6, 12]} />
        <meshStandardMaterial color="#111827" roughness={0.68} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.5, 0.08]} castShadow>
        <boxGeometry args={[0.42, 0.22, 0.3]} />
        <meshStandardMaterial color="#0b1220" roughness={0.62} metalness={0.08} />
      </mesh>

      <mesh position={[-0.29, 0.25, 0.08]} rotation={[0.2, 0, -0.7]} castShadow>
        <capsuleGeometry args={[0.055, 0.44, 5, 8]} />
        <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.06} />
      </mesh>
      <mesh position={[0.29, 0.25, 0.08]} rotation={[0.2, 0, 0.7]} castShadow>
        <capsuleGeometry args={[0.055, 0.44, 5, 8]} />
        <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.06} />
      </mesh>

      <mesh position={[-0.44, 0.14, 0.22]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0.44, 0.14, 0.22]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} metalness={0.05} />
      </mesh>

      <mesh position={[0, 0.66, 0.07]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 12]} />
        <meshStandardMaterial color="#f1c6a8" roughness={0.62} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0.82, 0.07]} castShadow>
        <sphereGeometry args={[0.16, 18, 18]} />
        <meshStandardMaterial color="#f1c6a8" roughness={0.62} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0.9, 0.06]} castShadow>
        <sphereGeometry args={[0.2, 18, 18]} />
        <meshStandardMaterial color="#111827" roughness={0.45} metalness={0.24} />
      </mesh>

      <mesh position={[0, 0.83, 0.19]} castShadow>
        <boxGeometry args={[0.24, 0.09, 0.05]} />
        <meshStandardMaterial color="#fb923c" emissive="#7c2d12" emissiveIntensity={0.12} roughness={0.25} />
      </mesh>
    </group>
  );
}

function FollowSkierCamera({
  skierRef,
  controlsRef,
}: {
  skierRef: MutableRefObject<THREE.Group | null>;
  controlsRef: MutableRefObject<any>;
}): JSX.Element | null {
  const { camera } = useThree();
  const cameraOffset = useMemo(() => new THREE.Vector3(0, 1.62, -3.3), []);
  const lookOffset = useMemo(() => new THREE.Vector3(0, 0.9, 2.1), []);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredLookAt = useMemo(() => new THREE.Vector3(), []);
  const skierWorldPosition = useMemo(() => new THREE.Vector3(), []);
  const prevSkierWorldPosition = useRef(new THREE.Vector3());
  const hasPrevPosition = useRef(false);
  const headingYawRef = useRef(Math.PI);
  const moveDelta = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const yawQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, delta) => {
    const skier = skierRef.current;
    if (!skier) {
      return;
    }

    skier.getWorldPosition(skierWorldPosition);

    if (!hasPrevPosition.current) {
      prevSkierWorldPosition.current.copy(skierWorldPosition);
      hasPrevPosition.current = true;
    }

    moveDelta.subVectors(skierWorldPosition, prevSkierWorldPosition.current);
    moveDelta.y = 0;

    // Drive camera heading from movement direction so rail stance (90-degree visual yaw) does not rotate camera.
    if (moveDelta.lengthSq() > 0.00002) {
      const desiredYaw = Math.atan2(moveDelta.x, moveDelta.z);
      headingYawRef.current = THREE.MathUtils.lerp(headingYawRef.current, desiredYaw, 1 - Math.exp(-10 * delta));
    }

    prevSkierWorldPosition.current.copy(skierWorldPosition);
    yawQuat.setFromAxisAngle(up, headingYawRef.current);
    desiredPosition.copy(cameraOffset).applyQuaternion(yawQuat).add(skierWorldPosition);
    desiredLookAt.copy(lookOffset).applyQuaternion(yawQuat).add(skierWorldPosition);

    const blend = 1 - Math.exp(-7.5 * delta);
    camera.position.lerp(desiredPosition, blend);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredLookAt, blend);
      controlsRef.current.update();
    } else {
      camera.lookAt(desiredLookAt);
    }
  });

  return null;
}

function ParkLayout({ skierRef }: { skierRef: MutableRefObject<THREE.Group | null> }): JSX.Element {
  // Match the top surface of the rotated slope box so park features sit on snow.
  const railSlopeY = (z: number) => slopeSurfaceY(z);
  const railBaseY = (z: number) => railSlopeY(z) + 0.06;
  const kickerBaseY = (z: number) => railSlopeY(z) + 0.12;

  return (
    <group>
      <BackgroundDome />
      <fog attach="fog" args={["#d7ebff", 60, 300]} />

      <ambientLight intensity={0.78} />
      <directionalLight
        position={[8, 16, 11]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <group scale={[PARK_SCALE, PARK_SCALE, PARK_SCALE]}>
        <SlopeBase />
        <SkierCharacter skierRef={skierRef} />

        {/* Rail line (left lane) */}
        <RailKicker position={[-6.4, kickerBaseY(-166.8), -166.8]} scale={FEATURE_SCALE} />
        <RainbowRail position={[-6.4, railBaseY(-170.0), -170.0]} rotationY={0.0} scale={FEATURE_SCALE} />
        <RailKicker position={[-6.4, kickerBaseY(-116.8), -116.8]} scale={FEATURE_SCALE} />
        <StraightRail position={[-6.4, railBaseY(-120.0), -120.0]} length={7.2} railRadius={0.13} rotationY={0.0} scale={FEATURE_SCALE} />
        <RailKicker position={[-6.4, kickerBaseY(-66.8), -66.8]} scale={FEATURE_SCALE} />
        <StraightRail position={[-6.4, railBaseY(-70.0), -70.0]} length={6.8} rotationY={0.0} scale={FEATURE_SCALE} />
        <RailKicker position={[-6.4, kickerBaseY(-16.8), -16.8]} scale={FEATURE_SCALE} />
        <KinkedRail position={[-6.4, railBaseY(-20.0), -20.0]} rotationY={0.0} scale={FEATURE_SCALE} />

        <LandingBank position={[-6.3, railSlopeY(-95.0) - 0.8, -95.0]} rotationY={0.0} />
        <LandingBank position={[-6.35, railSlopeY(-45.0) - 0.8, -45.0]} rotationY={0.0} />
      </group>
    </group>
  );
}

export function SkiParkMap3D() {
  const skierRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<any>(null);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 10.5, 68], fov: 48, near: 0.1, far: 1400 }}
      className="gate-game__canvas"
    >
      <ParkLayout skierRef={skierRef} />
      <FollowSkierCamera skierRef={skierRef} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={4}
        maxDistance={28}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.7, -24]}
      />
    </Canvas>
  );
}
