import React, { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { Html } from "@react-three/drei";

function Poster({
  position = [0, 2, 0.31], // Slightly in front of wall
  rotation = [0, 0, 0],
  size = [1, 1.5], // Width and height of the poster
  imageUrl = "/api/placeholder/400/600", // Default placeholder image
  title = "Poster Title",
  onClick,
}) {
  const texture = useLoader(TextureLoader, imageUrl);

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <group position={position} rotation={rotation}>
      {/* Poster Frame */}
      <mesh castShadow receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial map={texture} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Clickable area with hover effect */}
      <mesh
        position={[0, 0, 0.01]} // Slightly in front of poster
        onClick={onClick}
        // onPointerOver={(e) => {
        //   document.body.style.cursor = "pointer";
        //   e.stopPropagation();
        // }}
        // onPointerOut={(e) => {
        //   document.body.style.cursor = "auto";
        //   e.stopPropagation();
        // }}
      >
        <planeGeometry args={size} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Optional: Add an HTML tooltip on hover */}
      {/* <Html
        position={[size[0]/2 + 0.1, 0, 0]}
        style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '8px',
          borderRadius: '4px',
          color: 'white',
          fontSize: '12px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}
        center
      >
        {title}
      </Html> */}
    </group>
  );
}

// Example usage in your App component:
function PosterCollection() {
    const posters = [
        {
          position: [-0, 2, 0], // Left side of back wall
          title: "Interstellar",
          imageUrl: "https://m.media-amazon.com/images/I/81kz06oSUeL.jpg",
        },
        {
          position: [-0, 2, 0], // Left side of back wall
          title: "The Secret life of Walter Mitty",
          imageUrl: "https://m.media-amazon.com/images/I/61Xd6dbtJKL._AC_UF894,1000_QL80_.jpg",
        },
        {
          position: [-0, 2, 0], // Left side of back wall
          title: "Cards",
          imageUrl: "https://m.media-amazon.com/images/I/91J9Eoa0udL.jpg",
        },
        {
          position: [-0, 2, 0], // Left side of back wall
          title: "Hitchhiker's Guide to the Galaxy",
          imageUrl: "https://m.media-amazon.com/images/I/71B6QY1xu6L._AC_UF894,1000_QL80_.jpg",
        },
      ];
    

  return (
    <>
      {posters.map((poster, index) => (
        <Poster
          key={index}
          position={poster.position}
          title={poster.title}
          imageUrl={poster.imageUrl}
          onClick={() => console.log(`Clicked poster: ${poster.title}`)}
        />
      ))}
    </>
  );
}

export { Poster, PosterCollection };
