import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { type JSX, type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import skiBackdropUrl from "../assets/ski-backdrop.jpg";

const PARK_SCALE = 0.6;
const SLOPE_PITCH = -0.055;
const SLOPE_SURFACE_Y_AT_ZERO = 1.49;
const SLOPE_Y_PER_Z = 0.055;

const BIG_AIR_JUMP = {
  x: -6.4,
  z: -110,
  scale: 1.12,
  width: 11.5,
  kickerOffsetZ: 9.4,
  landingOffsetZ: -20.0,
  tableOffsetZ: -2.3,
  kickerLength: 14.2,
  landingLength: 18.0,
  tableLength: 3.8,
  kickerHeight: 3.0,
  landingHeight: 2.75,
  tableHeight: 2.72,
} as const;

const slopeSurfaceY = (z: number) => SLOPE_SURFACE_Y_AT_ZERO + SLOPE_Y_PER_Z * z;

type SkiTopsheetVariant = "left" | "right";

function createReckoner102TopsheetTexture(variant: SkiTopsheetVariant): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 2048;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  const tieDye = ctx.createLinearGradient(0, 0, 0, canvas.height);
  tieDye.addColorStop(0, "#5f7f95");
  tieDye.addColorStop(0.3, "#5b7591");
  tieDye.addColorStop(0.52, "#6a708f");
  tieDye.addColorStop(0.72, "#6e6f88");
  tieDye.addColorStop(1, "#66728a");
  ctx.fillStyle = tieDye;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cloudBlobs = [
    { x: 0.22, y: 0.08, r: 0.22, color: "rgba(90, 173, 173, 0.44)" },
    { x: 0.78, y: 0.15, r: 0.2, color: "rgba(223, 164, 111, 0.35)" },
    { x: 0.38, y: 0.22, r: 0.24, color: "rgba(144, 120, 183, 0.33)" },
    { x: 0.68, y: 0.35, r: 0.2, color: "rgba(98, 149, 202, 0.34)" },
    { x: 0.26, y: 0.48, r: 0.24, color: "rgba(201, 136, 171, 0.3)" },
    { x: 0.74, y: 0.62, r: 0.22, color: "rgba(108, 172, 127, 0.33)" },
    { x: 0.3, y: 0.78, r: 0.27, color: "rgba(237, 166, 124, 0.3)" },
    { x: 0.72, y: 0.9, r: 0.2, color: "rgba(140, 128, 205, 0.34)" },
  ];

  cloudBlobs.forEach((blob) => {
    const gx = blob.x * canvas.width;
    const gy = blob.y * canvas.height;
    const radius = blob.r * canvas.width;
    const grad = ctx.createRadialGradient(gx, gy, radius * 0.08, gx, gy, radius);
    grad.addColorStop(0, blob.color);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gx, gy, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let y = 0; y < canvas.height; y += 3) {
    const alpha = 0.02 + ((y / 3) % 5) * 0.002;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const drawK2Badge = (x: number, y: number, w: number, h: number, vertical: boolean) => {
    ctx.fillStyle = "#ece5bc";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#8d8a6a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#6f6a3d";
    ctx.font = "700 34px 'Arial Black', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (vertical) {
      ctx.save();
      ctx.translate(x + w * 0.52, y + h * 0.5);
      ctx.rotate(-Math.PI * 0.5);
      ctx.fillText("K2 K2 K2", 0, -18);
      ctx.fillText("K2", 0, 20);
      ctx.restore();
    } else {
      ctx.fillText("K2", x + w * 0.24, y + h * 0.5);
      ctx.fillText("K2", x + w * 0.5, y + h * 0.5);
      ctx.fillText("K2", x + w * 0.76, y + h * 0.5);
    }
  };

  drawK2Badge(94, 170, 68, 330, true);
  drawK2Badge(94, 1620, 68, 300, true);

  ctx.fillStyle = "#ece5bc";
  ctx.fillRect(52, 1010, 152, 58);
  ctx.strokeStyle = "#8d8a6a";
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 1010, 152, 58);
  ctx.fillStyle = "#4e5b44";
  ctx.font = "700 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Reckoner", 128, 1030);
  ctx.font = "700 24px Arial, sans-serif";
  ctx.fillText("102", 128, 1048);

  const drawSquiggle = (points: Array<[number, number]>, color: string, width: number) => {
    if (points.length < 2) {
      return;
    }

    const firstPoint = points[0];
    if (!firstPoint) {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(firstPoint[0], firstPoint[1]);
    for (let i = 1; i < points.length; i += 1) {
      const p = points[i];
      if (!p) {
        continue;
      }
      ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  };

  const topDoodle = variant === "right"
    ? [
        [170, 520], [186, 544], [162, 570], [194, 594], [166, 622],
      ]
    : [
        [86, 560], [66, 586], [92, 608], [70, 636], [102, 664],
      ];

  drawSquiggle(topDoodle as Array<[number, number]>, "#82d4a7", 12);
  drawSquiggle(topDoodle as Array<[number, number]>, "#2c3e63", 4);

  const tailSetA = [
    [56, 1540], [78, 1575], [54, 1610], [84, 1645], [62, 1680], [90, 1715],
    [66, 1750], [94, 1785], [70, 1820],
  ] as Array<[number, number]>;
  const tailSetB = tailSetA.map(([x, y], i) => [x + 54, y + (i % 2 === 0 ? -8 : 10)] as [number, number]);
  const tailSetC = tailSetA.map(([x, y], i) => [x + 104, y + (i % 3 === 0 ? -6 : 12)] as [number, number]);

  const palette = ["#ff9856", "#ffde59", "#77e37f", "#5fc0ff", "#f27cd4"];
  [tailSetA, tailSetB, tailSetC].forEach((points, idx) => {
    drawSquiggle(points, palette[idx] ?? "#ffffff", 11);
    drawSquiggle(points, "#1f2d4f", 3.5);
  });

  if (variant === "left") {
    const mountainGrad = ctx.createLinearGradient(0, 1840, 0, 2048);
    mountainGrad.addColorStop(0, "rgba(73, 88, 104, 0)");
    mountainGrad.addColorStop(1, "rgba(62, 74, 88, 0.95)");
    ctx.fillStyle = mountainGrad;
    ctx.fillRect(0, 1840, canvas.width, 208);

    ctx.fillStyle = "#d8e8f3";
    ctx.beginPath();
    ctx.moveTo(14, 1992);
    ctx.lineTo(58, 1948);
    ctx.lineTo(94, 1992);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(130, 1992);
    ctx.lineTo(174, 1952);
    ctx.lineTo(224, 1992);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

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

function MassiveBigAirJump({ position, pitch = -0.055, width = BIG_AIR_JUMP.width, scale = BIG_AIR_JUMP.scale }: {
  position: [number, number, number];
  pitch?: number;
  width?: number;
  scale?: number;
}): JSX.Element {
  const [x, y, z] = position;

  const kickerGeometry = useMemo(() => {
    const profile = new THREE.Shape();
    profile.moveTo(-12.5, 0);
    profile.lineTo(-8.4, 0.02);
    profile.quadraticCurveTo(-5.5, 0.08, -3.4, 0.34);
    profile.quadraticCurveTo(-1.3, 0.78, 0.1, 1.6);
    profile.quadraticCurveTo(1.1, 2.35, 1.7, 3.0);
    profile.lineTo(1.7, 0);
    profile.lineTo(-12.5, 0);

    const geometry = new THREE.ExtrudeGeometry(profile, {
      depth: width,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geometry.translate(0, 0, -width * 0.5);
    geometry.rotateY(Math.PI * 0.5);
    return geometry;
  }, [width]);

  const landingGeometry = useMemo(() => {
    const profile = new THREE.Shape();
    profile.moveTo(-1.2, 0);
    profile.lineTo(-1.2, 2.75);
    profile.quadraticCurveTo(2.8, 2.62, 7.2, 1.45);
    profile.quadraticCurveTo(11.5, 0.5, 16.8, 0);
    profile.lineTo(16.8, 0);
    profile.lineTo(-1.2, 0);

    const geometry = new THREE.ExtrudeGeometry(profile, {
      depth: width + 0.8,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 26,
    });
    geometry.translate(0, 0, -(width + 0.8) * 0.5);
    geometry.rotateY(Math.PI * 0.5);
    return geometry;
  }, [width]);

  useEffect(() => {
    return () => {
      kickerGeometry.dispose();
      landingGeometry.dispose();
    };
  }, [kickerGeometry, landingGeometry]);

  return (
    <group position={[x, y, z]} rotation={[pitch, 0, 0]} scale={[scale, scale, scale]}>
      <mesh geometry={kickerGeometry} position={[0, 0, 9.4]} castShadow receiveShadow>
        <SnowMaterial />
      </mesh>

      <mesh position={[0, 1.36, -2.3]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.8, 2.72, 3.8]} />
        <SnowMaterial />
      </mesh>

      <mesh geometry={landingGeometry} position={[0, 0, -20.0]} castShadow receiveShadow>
        <SnowMaterial />
      </mesh>

      <mesh position={[0, 0.08, -7.6]} receiveShadow>
        <boxGeometry args={[width + 2.4, 0.12, 10.6]} />
        <meshStandardMaterial color="#d3e4f4" roughness={0.9} metalness={0.01} />
      </mesh>
    </group>
  );
}

function SkierCharacter({ skierRef }: { skierRef: MutableRefObject<THREE.Group | null> }): JSX.Element {
  const keyStateRef = useRef({ left: false, right: false, up: false, down: false, jump: false });
  const speedRef = useRef(18);
  const velocityRef = useRef(new THREE.Vector3(0, 0, -18));
  const velocityYRef = useRef(0);
  const groundedRef = useRef(true);
  const jumpLatchRef = useRef(false);
  const positionRef = useRef(new THREE.Vector3(-6.4, 0, 135));
  const headingYawRef = useRef(Math.PI);
  const trickPitchRef = useRef(0);
  const trickRollRef = useRef(0);
  const flipVelocityRef = useRef(0);
  const jumpLaunchLatchRef = useRef(false);

  const riderBaseHeight = 0.52;
  const railRideLift = 0.72;
  const steerVisualRef = useRef(0);
  const leftSkiTopTexture = useMemo(() => createReckoner102TopsheetTexture("left"), []);
  const rightSkiTopTexture = useMemo(() => createReckoner102TopsheetTexture("right"), []);

  const railColliders = useMemo<Array<{ x: number; z: number; halfLength: number; collisionRadius: number }>>(() => [], []);

  const jumpColliders = useMemo<Array<{
    kind: "kicker" | "table" | "landing";
    x: number;
    z: number;
    halfWidth: number;
    halfLength: number;
    maxLift: number;
  }>>(
    () => {
      const scaledWidth = BIG_AIR_JUMP.width * BIG_AIR_JUMP.scale;
      const halfWidth = scaledWidth * 0.5 + 0.35;

      return [
        {
          kind: "kicker",
          x: BIG_AIR_JUMP.x,
          z: BIG_AIR_JUMP.z + BIG_AIR_JUMP.kickerOffsetZ * BIG_AIR_JUMP.scale,
          halfWidth,
          halfLength: (BIG_AIR_JUMP.kickerLength * BIG_AIR_JUMP.scale) * 0.5,
          maxLift: BIG_AIR_JUMP.kickerHeight,
        },
        {
          kind: "table",
          x: BIG_AIR_JUMP.x,
          z: BIG_AIR_JUMP.z + BIG_AIR_JUMP.tableOffsetZ * BIG_AIR_JUMP.scale,
          halfWidth,
          halfLength: (BIG_AIR_JUMP.tableLength * BIG_AIR_JUMP.scale) * 0.5,
          maxLift: BIG_AIR_JUMP.tableHeight,
        },
        {
          kind: "landing",
          x: BIG_AIR_JUMP.x,
          z: BIG_AIR_JUMP.z + BIG_AIR_JUMP.landingOffsetZ * BIG_AIR_JUMP.scale,
          halfWidth: halfWidth + 0.55,
          halfLength: (BIG_AIR_JUMP.landingLength * BIG_AIR_JUMP.scale) * 0.5,
          maxLift: BIG_AIR_JUMP.landingHeight,
        },
      ];
    },
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
        case "KeyA":
          keyStateRef.current.left = true;
          event.preventDefault();
          break;
        case "ArrowRight":
        case "KeyD":
          keyStateRef.current.right = true;
          event.preventDefault();
          break;
        case "ArrowUp":
        case "KeyW":
          keyStateRef.current.up = true;
          event.preventDefault();
          break;
        case "ArrowDown":
        case "KeyS":
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
        case "KeyA":
          keyStateRef.current.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          keyStateRef.current.right = false;
          break;
        case "ArrowUp":
        case "KeyW":
          keyStateRef.current.up = false;
          break;
        case "ArrowDown":
        case "KeyS":
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

  useEffect(() => {
    return () => {
      leftSkiTopTexture.dispose();
      rightSkiTopTexture.dispose();
    };
  }, [leftSkiTopTexture, rightSkiTopTexture]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = keyStateRef.current;
    const position = positionRef.current;
    const horizontalVelocity = velocityRef.current;
    const wasGrounded = groundedRef.current;

    const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const accelerate = keys.up ? 1 : 0;
    const brake = keys.down ? 1 : 0;

    if (groundedRef.current) {
      const steerGrip = THREE.MathUtils.clamp(0.35 + speedRef.current / 18, 0.35, 1.25);
      headingYawRef.current -= steer * 2.4 * steerGrip * dt;

      speedRef.current += accelerate * 26 * dt;
      speedRef.current -= brake * 24 * dt;
      if (accelerate === 0 && brake === 0) {
        speedRef.current = THREE.MathUtils.damp(speedRef.current, 0, 4.2, dt);
      }
      speedRef.current = THREE.MathUtils.clamp(speedRef.current, 0, 34);

      horizontalVelocity.x = Math.sin(headingYawRef.current) * speedRef.current;
      horizontalVelocity.z = Math.cos(headingYawRef.current) * speedRef.current;
    } else {
      // Air control: allow spins and flips while preserving most momentum.
      headingYawRef.current -= steer * 6.8 * dt;
      const airDragScale = Math.max(0, 1 - 0.22 * dt);
      horizontalVelocity.x *= airDragScale;
      horizontalVelocity.z *= airDragScale;
      speedRef.current = Math.hypot(horizontalVelocity.x, horizontalVelocity.z);

      const flipInput = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
      const targetFlipVelocity = flipInput * 7.2;
      flipVelocityRef.current = THREE.MathUtils.damp(flipVelocityRef.current, targetFlipVelocity, 6.5, dt);
      trickPitchRef.current += flipVelocityRef.current * dt;
      trickRollRef.current = THREE.MathUtils.damp(trickRollRef.current, steer * 0.7, 4.8, dt);
    }

    position.x += horizontalVelocity.x * dt;
    position.z += horizontalVelocity.z * dt;

    if (position.x < -14.5) {
      position.x = -14.5;
      horizontalVelocity.x = 0;
    } else if (position.x > 14.5) {
      position.x = 14.5;
      horizontalVelocity.x = 0;
    }

    if (keys.jump && groundedRef.current && !jumpLatchRef.current) {
      velocityYRef.current = 7.4;
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
      flipVelocityRef.current = THREE.MathUtils.damp(flipVelocityRef.current, 0, 10, dt);
      trickPitchRef.current = THREE.MathUtils.damp(trickPitchRef.current, 0, 8, dt);
      trickRollRef.current = THREE.MathUtils.damp(trickRollRef.current, 0, 8, dt);
    } else {
      velocityYRef.current -= 14.8 * dt;
      position.y += velocityYRef.current * dt;

      if (position.y <= groundY + 0.03) {
        position.y = groundY;
        velocityYRef.current = 0;
        groundedRef.current = true;
      }
    }

    // Make jump features solid for the skier so body/skis do not pass through kickers and banks.
    let featureSurfaceY = groundY;
    let queuedLaunchVelocity = 0;
    let insideKickerCollider = false;
    let touchingJumpSurface = false;
    for (let i = 0; i < jumpColliders.length; i += 1) {
      const collider = jumpColliders[i];
      if (!collider) {
        continue;
      }

      if (Math.abs(position.x - collider.x) > collider.halfWidth + 0.35) {
        continue;
      }
      if (Math.abs(position.z - collider.z) > collider.halfLength + 0.3) {
        continue;
      }

      touchingJumpSurface = true;

      const entryZ = collider.z + collider.halfLength;
      const exitZ = collider.z - collider.halfLength;
      const progress = THREE.MathUtils.clamp((entryZ - position.z) / Math.max(0.001, entryZ - exitZ), 0, 1);

      let lift = 0;
      if (collider.kind === "kicker") {
        insideKickerCollider = true;
        const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
        lift = collider.maxLift * Math.pow(eased, 1.75);

        if (!jumpLaunchLatchRef.current && progress > 0.92 && groundedRef.current && speedRef.current > 13) {
          queuedLaunchVelocity = Math.max(queuedLaunchVelocity, 8.6 + speedRef.current * 0.08);
          jumpLaunchLatchRef.current = true;
        }
      } else if (collider.kind === "table") {
        // Keep skier above the tabletop block so body/skis don't pass through it.
        lift = collider.maxLift;
      } else {
        const eased = 1 - THREE.MathUtils.smoothstep(progress, 0, 1);
        lift = collider.maxLift * Math.pow(eased, 1.12);
      }

      lift = Math.max(0.2, lift);
      const candidateSurfaceY = slopeSurfaceY(position.z) + riderBaseHeight + lift;
      featureSurfaceY = Math.max(featureSurfaceY, candidateSurfaceY);
    }

    if (!insideKickerCollider) {
      jumpLaunchLatchRef.current = false;
    }

    if (touchingJumpSurface && featureSurfaceY > groundY + 0.01) {
      const jumpSurfacePadding = 0.11;
      const jumpSnapDistance = 0.42;
      const minJumpY = featureSurfaceY + jumpSurfacePadding;

      // Hard anti-penetration clamp: jump surfaces are treated like solid ground with a tiny safety offset.
      if (position.y < minJumpY) {
        position.y = minJumpY;
        velocityYRef.current = Math.max(velocityYRef.current, 0);
        groundedRef.current = true;
      } else {
        const shouldSnapToFeature = groundedRef.current || (velocityYRef.current <= 0 && position.y <= minJumpY + jumpSnapDistance);
        if (shouldSnapToFeature) {
          position.y = minJumpY;
          velocityYRef.current = Math.max(velocityYRef.current, 0);
          groundedRef.current = true;
        }
      }
    }

    if (queuedLaunchVelocity > 0) {
      velocityYRef.current = Math.max(velocityYRef.current, queuedLaunchVelocity);
      position.y += 0.08;
      groundedRef.current = false;
    }

    // Keep rails solid without forcing rail-lock so spins and directional control remain free.
    for (let i = 0; i < railColliders.length; i += 1) {
      const collider = railColliders[i];
      if (!collider) {
        continue;
      }
      if (Math.abs(position.z - collider.z) > collider.halfLength + 0.25) {
        continue;
      }
      if (Math.abs(position.x - collider.x) > collider.collisionRadius + 0.3) {
        continue;
      }

      const railSurfaceY = slopeSurfaceY(position.z) + riderBaseHeight + railRideLift;
      const lowNearRail = position.y <= railSurfaceY + 0.26;
      if (groundedRef.current || (velocityYRef.current <= 0 && lowNearRail)) {
        position.y = Math.max(position.y, railSurfaceY);
        velocityYRef.current = Math.max(velocityYRef.current, 0);
        groundedRef.current = true;
      }
    }

    if (!wasGrounded && groundedRef.current) {
      const landingSpeed = Math.hypot(horizontalVelocity.x, horizontalVelocity.z);
      speedRef.current = THREE.MathUtils.clamp(landingSpeed, 0, 34);
      horizontalVelocity.x = Math.sin(headingYawRef.current) * speedRef.current;
      horizontalVelocity.z = Math.cos(headingYawRef.current) * speedRef.current;
    }

    // Loop the skier back to the top section once the run is completed.
    if (position.z < -250) {
      position.set(-6.4, slopeSurfaceY(150) + riderBaseHeight, 150);
      headingYawRef.current = Math.PI;
      speedRef.current = 18;
      horizontalVelocity.x = 0;
      horizontalVelocity.z = -18;
      velocityYRef.current = 0;
      groundedRef.current = true;
      jumpLatchRef.current = false;
      trickPitchRef.current = 0;
      trickRollRef.current = 0;
      flipVelocityRef.current = 0;
      jumpLaunchLatchRef.current = false;
    }

    if (skierRef.current) {
      skierRef.current.position.copy(position);
      steerVisualRef.current = THREE.MathUtils.damp(steerVisualRef.current, steer, 10, dt);
      const speedLean = THREE.MathUtils.clamp(speedRef.current / 24, 0, 1);
      const yaw = headingYawRef.current;
      const roll = steerVisualRef.current * 0.24 * speedLean + trickRollRef.current;
      skierRef.current.rotation.set(SLOPE_PITCH + trickPitchRef.current, yaw, roll);
    }
  });

  return (
    <group ref={skierRef} position={[-6.4, slopeSurfaceY(135) + riderBaseHeight, 135]}>
      <group position={[-0.24, -0.46, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.13, 0.045, 1.95]} />
          <meshStandardMaterial color="#2b3441" roughness={0.62} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.024, 0]} rotation={[-Math.PI * 0.5, 0, 0]} castShadow>
          <planeGeometry args={[0.126, 1.92]} />
          <meshStandardMaterial
            map={leftSkiTopTexture}
            roughness={0.54}
            metalness={0.04}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      </group>
      <group position={[0.24, -0.46, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.13, 0.045, 1.95]} />
          <meshStandardMaterial color="#2b3441" roughness={0.62} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.024, 0]} rotation={[-Math.PI * 0.5, 0, 0]} castShadow>
          <planeGeometry args={[0.126, 1.92]} />
          <meshStandardMaterial
            map={rightSkiTopTexture}
            roughness={0.54}
            metalness={0.04}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      </group>
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
    // Use shortest-path angular interpolation to avoid 180-degree flips at the -PI/PI wrap boundary.
    if (moveDelta.lengthSq() > 0.00002) {
      const desiredYaw = Math.atan2(moveDelta.x, moveDelta.z);
      const yawDelta = Math.atan2(
        Math.sin(desiredYaw - headingYawRef.current),
        Math.cos(desiredYaw - headingYawRef.current),
      );
      headingYawRef.current += yawDelta * (1 - Math.exp(-10 * delta));
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
  const parkSlopeY = (z: number) => slopeSurfaceY(z);

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

        {/* Single oversized jump line inspired by a big-air booter: rounded kicker, table block, rounded landing. */}
        <MassiveBigAirJump position={[BIG_AIR_JUMP.x, parkSlopeY(BIG_AIR_JUMP.z) + 0.18, BIG_AIR_JUMP.z]} scale={BIG_AIR_JUMP.scale} />
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
