import React, { useEffect, useMemo } from "react";
import { DoubleSide, Vector2, RepeatWrapping } from "three";
import { useLoader, useThree } from "@react-three/fiber";
import { TextureLoader } from "three";

function Wall({
  textureUrl = "https://t4.ftcdn.net/jpg/02/97/09/85/360_F_297098515_noDOtzUeSdCKRTnZQjgMc3rNmHeMIKrw.jpg",
  normalMapUrl = '/WallNormalMap.jpg', // Add normal map for surface detail
  roughnessMapUrl = '/WallRoughnessMap.jpg', // Add roughness map for surface variation
  position = [0, 2.5, 0],
  rotation = [0, 0, 0],
  size = [10, 5],
  textureScale = [2, 1], // Configurable texture scaling
}) {
  const { gl } = useThree();

  // Load all textures simultaneously
  const [texture, normalMap, roughnessMap] = useLoader(TextureLoader, [
    textureUrl,
    normalMapUrl,
    roughnessMapUrl
  ].filter(Boolean));

  // Configure texture settings using useMemo to optimize performance
  const configuredTextures = useMemo(() => {
    const textures = { baseTexture: null, normalMap: null, roughnessMap: null };
    
    if (texture) {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat = new Vector2(...textureScale);
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      textures.baseTexture = texture;
    }

    if (normalMap) {
      normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
      normalMap.repeat = new Vector2(...textureScale);
      textures.normalMap = normalMap;
    }

    if (roughnessMap) {
      roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping;
      roughnessMap.repeat = new Vector2(...textureScale);
      textures.roughnessMap = roughnessMap;
    }

    return textures;
  }, [texture, normalMap, roughnessMap, textureScale, gl]);

  // Calculate real-world scale for more accurate material properties
  const realWorldScale = useMemo(() => {
    const [width, height] = size;
    return Math.max(width, height);
  }, [size]);

  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <planeGeometry args={size}>
        {/* Add vertex displacement for surface detail */}
        <bufferAttribute
          attach="attributes-uv2"
          array={new Float32Array(size[0] * size[1] * 2)}
          count={size[0] * size[1]}
          itemSize={2}
        />
      </planeGeometry>
      <meshStandardMaterial
        map={configuredTextures.baseTexture}
        normalMap={configuredTextures.normalMap}
        roughnessMap={configuredTextures.roughnessMap}
        normalScale={new Vector2(0.5, 0.5)} // Adjust normal map intensity
        side={DoubleSide}
        roughness={0.85} // Slightly increased for most wall materials
        metalness={0.05} // Reduced for non-metallic surfaces
        envMapIntensity={0.8} // Subtle environment reflections
        // Scale material properties based on real-world size
        normalScaleX={0.1 * realWorldScale}
        normalScaleY={0.1 * realWorldScale}
      />
    </mesh>
  );
}

export default Wall;