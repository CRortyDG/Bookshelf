import React, { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, RepeatWrapping } from "three";

function Floor({
  textureUrl = "https://t3.ftcdn.net/jpg/01/63/88/10/360_F_163881016_H2HzI9JD4JbZVPCVMu6X3Vy91HLSVGqd.jpg",
}) {
  // Load the texture
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      // Configure texture settings
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(4, 4); // Adjust the repeat value to control texture tiling
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
    </mesh>
  );
}


export default Floor;