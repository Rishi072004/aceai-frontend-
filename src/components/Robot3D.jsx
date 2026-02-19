import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useScroll } from "framer-motion";
import { useRef } from "react";

function Model() {
  const { scene } = useGLTF("/models/robot.glb");
  const ref = useRef();
  const { scrollYProgress } = useScroll();

  scene.traverse((child) => {
    if (child.isMesh) {
      child.material.metalness = 0.2;
      child.material.roughness = 0.1;
    }
  });

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y =
      -0.5 + scrollYProgress.get();

    ref.current.rotation.x =
      state.mouse.y * 0.5;

    ref.current.position.y =
      Math.sin(state.clock.elapsedTime) * 0.01;
  });

  return <primitive ref={ref} object={scene} scale={2} />;
}

function MovingSpotlight() {
  const spotRef = useRef();

  useFrame((state) => {
    if (!spotRef.current) return;

    spotRef.current.position.x =
      Math.sin(state.clock.elapsedTime * 0.5) * 6;
  });

  return (
    <spotLight
      ref={spotRef}
      position={[-5, 5, 5]}
      angle={0.3}
      intensity={2}
      penumbra={1}
      castShadow
    />
  );
}

export default function Robot3D() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>

      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 3, 3]} intensity={2} />
      <pointLight
        position={[0, 2, 2]}
        color="#a855f7"
        intensity={3}
      />

      <Environment preset="city" />

      <Model />

      <MovingSpotlight />

      <OrbitControls enableZoom={false} />

    </Canvas>
  );
}
