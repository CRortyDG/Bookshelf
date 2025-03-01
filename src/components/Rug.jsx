import React, { Suspense } from "react";
import { useGLTF } from "@react-three/drei";

const RUGS = [
  {
    id: "rug1",
    name: "Rug 1",
    src: "/rugRound.glb",
    position: [0, 0, -2.3],
    scale: [2, 2, 2],
    excludedShelves: [0],
  },
  {
    id: "rug2",
    name: "Rug 2",
    src: "/roundSquare.glb",
    position: [0, 2, -2.5], // Left side of back wall
    scale: [2, 2, 2],
    excludedShelves: [],
  },
  {
    id: "rug3",
    name: "Rug 3",
    src: "/runDoormat.glb",
    position: [0, 0.75, -2.3],
    scale: [1.5, 1.5, 1.5],
    excludedShelves: [0],
  },
  {
    id: "rug4",
    name: "Rug 4",
    src: "/rugRounded.glb",
    position: [0, -2, -2.5], // Left side of back wall
    scale: [2, 2, 2],
    excludedShelves: [],
  },
  {
    id: "rug5",
    name: "Rug 5",
    src: "/rugRectangle.glb",
    position: [0, -2, -2.5], // Left side of back wall
    scale: [2, 2, 2],
    excludedShelves: [],
  },
];

const Rug = ({ position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], rug = 'rugRounded.glp', ...props }) => {
  const { scene } = useGLTF(rug);
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <primitive object={scene} castShadow />
    </group>
  );
};

// Optional: Preload the model
useGLTF.preload("/leather_chairgltf.glb");

export default Rug;
