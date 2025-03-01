import React, { Suspense } from "react";
import { useGLTF } from "@react-three/drei";


const Computer = ({ position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], screen = 'computerScreen.glp', ...props }) => {
  const { scene } = useGLTF(screen);
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <primitive object={scene} castShadow />
    </group>
  );
};

// Optional: Preload the model
useGLTF.preload("/computerScreen.glb");

export default Computer;
