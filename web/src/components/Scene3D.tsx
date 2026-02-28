import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ---- Chandelier ----
function Chandelier() {
  const groupRef = useRef<THREE.Group>(null!);
  const flamesRef = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.05;
    }
    flamesRef.current.forEach((flame, i) => {
      if (flame) {
        const mat = flame.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.5 + Math.sin(t * 8 + i * 1.3) * 0.5;
      }
    });
  });

  const candles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const r = 1.2;
      return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
    });
  }, []);

  return (
    <group ref={groupRef} position={[0, 3.5, -2]}>
      {/* Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.04, 8, 32]} />
        <meshStandardMaterial color="#8B7355" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Chain */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1, 6]} />
        <meshStandardMaterial color="#8B7355" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Candles */}
      {candles.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          {/* Candle body */}
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
            <meshStandardMaterial color="#F5E6C8" />
          </mesh>
          {/* Flame */}
          <mesh
            position={[0, 0.22, 0]}
            ref={(el) => { if (el) flamesRef.current[i] = el; }}
          >
            <coneGeometry args={[0.03, 0.1, 6]} />
            <meshStandardMaterial
              color="#FFB347"
              emissive="#FF6600"
              emissiveIntensity={2}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Point light per candle */}
          <pointLight color="#FFB347" intensity={0.8} distance={4} decay={2} position={[0, 0.3, 0]} />
        </group>
      ))}
    </group>
  );
}

// ---- Magnifying Glass ----
function MagnifyingGlass() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.3;
    ref.current.position.y = -0.5 + Math.sin(t * 0.5) * 0.1;
  });
  return (
    <group ref={ref} position={[-3, -0.5, -1]}>
      {/* Lens ring */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.4, 0.05, 8, 32]} />
        <meshStandardMaterial color="#8B7355" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Lens glass */}
      <mesh>
        <circleGeometry args={[0.38, 32]} />
        <meshStandardMaterial
          color="#88CCFF"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0.5, -0.5, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.025, 0.7, 8]} />
        <meshStandardMaterial color="#6B5B3E" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ---- Poison Vial ----
function PoisonVial() {
  const ref = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.y = 0.5 + Math.sin(t * 0.7) * 0.12;
    ref.current.rotation.z = Math.sin(t * 0.4) * 0.08;
    if (lightRef.current) {
      lightRef.current.intensity = 0.8 + Math.sin(t * 3) * 0.3;
    }
  });
  return (
    <group ref={ref} position={[3.5, 0.5, -0.5]}>
      {/* Vial body */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 12]} />
        <meshStandardMaterial
          color="#00FF44"
          emissive="#00AA22"
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Stopper */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <pointLight ref={lightRef} color="#00FF44" intensity={1} distance={3} decay={2} />
    </group>
  );
}

// ---- Pocket Watch ----
function PocketWatch() {
  const ref = useRef<THREE.Group>(null!);
  const hourRef = useRef<THREE.Mesh>(null!);
  const minRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Pendulum swing
    ref.current.rotation.z = Math.sin(t * 1.2) * 0.3;
    ref.current.position.y = -1 + Math.sin(t * 0.6) * 0.05;
    // Clock hands
    if (hourRef.current) hourRef.current.rotation.z = -t * 0.1;
    if (minRef.current) minRef.current.rotation.z = -t * 1.2;
  });

  return (
    <group ref={ref} position={[2.5, -1, -1.5]}>
      {/* Watch body */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Face */}
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 32]} />
        <meshStandardMaterial color="#F5E6C8" />
      </mesh>
      {/* Hour hand */}
      <mesh
        ref={hourRef}
        position={[0, 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={[0.025, 0.14, 0.01]} />
        <meshStandardMaterial color="#2C1810" />
      </mesh>
      {/* Minute hand */}
      <mesh
        ref={minRef}
        position={[0, 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={[0.015, 0.2, 0.01]} />
        <meshStandardMaterial color="#2C1810" />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 0.025, 0.31]}>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
        <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ---- Dagger ----
function Dagger() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.y = -0.8 + Math.sin(t * 0.8 + 1) * 0.15;
    ref.current.rotation.y = t * 0.2;
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.05;
  });
  return (
    <group ref={ref} position={[-2.5, -0.8, -2]} rotation={[0, 0, Math.PI / 6]}>
      {/* Blade */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.04, 0.6, 0.01]} />
        <meshStandardMaterial color="#C0C0C0" metalness={1} roughness={0.1} />
      </mesh>
      {/* Guard */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.25, 0.03, 0.03]} />
        <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.35, 8]} />
        <meshStandardMaterial color="#4A2C2A" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ---- Dust Particles ----
function DustParticles() {
  const ref = useRef<THREE.Points>(null!);
  const count = 300;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = Math.random() * 0.005 + 0.001;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      // Reset particles that drift too far up
      if (pos[i * 3 + 1] > 5) {
        pos[i * 3 + 1] = -4;
        pos[i * 3] = (Math.random() - 0.5) * 12;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#C9A96E"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// ---- Camera Rig (mouse parallax) ----
function CameraRig() {
  const { camera, gl } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useFrame(() => {
    const rect = gl.domElement.getBoundingClientRect();
    const cx = (mouse.current.x - rect.left) / rect.width - 0.5;
    const cy = (mouse.current.y - rect.top) / rect.height - 0.5;
    camera.position.x += (cx * 1.5 - camera.position.x) * 0.02;
    camera.position.y += (-cy * 0.8 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return (
    <mesh
      visible={false}
      onPointerMove={(e) => {
        mouse.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// ---- Main Scene ----
function SceneContent() {
  return (
    <>
      {/* Fog */}
      <fogExp2 attach="fog" color="#030308" density={0.04} />

      {/* Ambient — very dim blue */}
      <ambientLight color="#1a1a2e" intensity={0.3} />

      {/* Moonlight */}
      <directionalLight
        color="#4488BB"
        intensity={0.4}
        position={[5, 8, 3]}
        castShadow={false}
      />

      {/* Objects */}
      <Chandelier />
      <MagnifyingGlass />
      <PoisonVial />
      <PocketWatch />
      <Dagger />
      <DustParticles />

      {/* Sparkles */}
      <Sparkles
        count={60}
        scale={8}
        size={0.8}
        speed={0.2}
        color="#C9A96E"
        opacity={0.5}
      />

      <CameraRig />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#030308" }}
    >
      <SceneContent />
    </Canvas>
  );
}
