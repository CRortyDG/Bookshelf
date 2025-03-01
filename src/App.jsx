import React, { Suspense, useState, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import {
  DynamicBookshelf,
  DynamicBookCollection,
} from "./components/GLBBookshelfSystem";
import BookInfo from "./components/BooksInfo";
import EditUI  from "./components/edit/edit";
import Rug from "./components/Rug";
import Computer from "./components/Computer";

// Room Constants
const ROOM_WIDTH = 5;
const ROOM_HEIGHT = 4;
const ROOM_DEPTH = 5;

// Available Bookshelves Configuration
export const AVAILABLE_BOOKSHELVES = [
  {
    id: "classic",
    name: "Classic Wooden Bookshelf",
    src: "/bookshelf.glb",
    position: [0, 0, -2.3],
    scale: [2, 2, 2],
    excludedShelves: [0],
  },
  {
    id: "modern",
    name: "Modern Bookshelf",
    src: "/wooden_bookshelf_vmhndfu_high.glb",
    position: [0, 2, -2.5], // Left side of back wall
    scale: [2, 2, 2],
    excludedShelves: [],
  },
  {
    id: "modern-3",
    name: "Wooden Bookshelf",
    src: "/cc0_shelf_5.glb",
    position: [.9, .75, -2.3],
    scale: [1.5, 1.5, 1.5],
    excludedShelves: [0],
  }
];

// Room Component
const CompactRoom = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#a8e6ff" />
      </mesh>

      {/* Back Wall with Decorations */}
      <group position={[0, ROOM_HEIGHT/2, -ROOM_DEPTH/2]}>
        {/* The wall itself */}
        <mesh receiveShadow>
          <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
          <meshStandardMaterial color="#ffafd1" />
        </mesh>
        
        {/* Poster centered on back wall */}
        <mesh position={[0, 0.5, 0.01]} receiveShadow>
          <planeGeometry args={[1, 1.5]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>
      </group>

      {/* Left Wall with Decorations */}
      <group position={[-ROOM_WIDTH/2, ROOM_HEIGHT/2, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* The wall itself */}
        <mesh receiveShadow>
          <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
          <meshStandardMaterial color="#e6e6ff" />
        </mesh>
        
        {/* Poster on left wall */}
        <mesh position={[-1, 0, 0.01]} receiveShadow>
          <planeGeometry args={[0.8, 1.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Right Wall with Decorations */}
      <group position={[ROOM_WIDTH/2, ROOM_HEIGHT/2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* The wall itself */}
        <mesh receiveShadow>
          <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
          <meshStandardMaterial color="#e6e6ff" />
        </mesh>
        
        {/* Poster on right wall */}
        <mesh position={[1, 0.3, 0.01]} receiveShadow>
          <planeGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
      </group>
    </group>
  );
};

// Isometric View Controller
const IsometricViewController = () => {
  const { camera, controls } = useThree();
  
  React.useEffect(() => {
    camera.position.set(6, 4, 6);
    camera.lookAt(0, 2, 0);
    
    if (controls) {
      controls.target.set(0, 2, 0);
      controls.minDistance = 1;
      controls.maxDistance = 15;
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 2.5;
      controls.minAzimuthAngle = -Math.PI / 4;
      controls.maxAzimuthAngle = Math.PI / 4;
      controls.update();
    }
  }, [camera, controls]);
  
  return null;
};

// Main App Component
function App() {
  const [hoveredBook, setHoveredBook] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [detectedShelves, setDetectedShelves] = useState([]);
  const [selectedBookshelf, setSelectedBookshelf] = useState(AVAILABLE_BOOKSHELVES[2]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);

  const handleBookSelect = useCallback((book) => {
    setSelectedBook(book);
    setHoveredBook(book);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedBook(null);
    setHoveredBook(null);
  }, []);

  const handleShelvesDetected = useCallback((shelves) => {
    setDetectedShelves(shelves);
    setIsLoading(false);
  }, []);

  const handleSelectBookshelf = useCallback((bookshelf) => {
    setIsLoading(true);
    setSelectedBookshelf(bookshelf);
    setSelectedBook(null);
    setHoveredBook(null);
    setKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (key > 0) {
      const timer = setTimeout(() => {
        if (detectedShelves.length === 0) {
          console.log("Retrying shelf detection...");
          setKey((prev) => prev + 1);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [key, detectedShelves.length]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas shadows camera={{ position: [6, 4, 6], fov: 50 }}>
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          target={[0, 0, -2.5]}
          
          minDistance={-2}
          maxDistance={15}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          makeDefault
        />

        <IsometricViewController />
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[2, 2, 2]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-4, 9, 3]}
          intensity={0.8}
          castShadow={false}
        />

        <CompactRoom />

        <Suspense fallback={null}>
          <DynamicBookshelf
            key={`bookshelf-${key}`}
            position={selectedBookshelf.position}
            scale={selectedBookshelf.scale}
            rotation={selectedBookshelf.rotation}
            onShelvesDetected={handleShelvesDetected}
            bookshelfSrc={selectedBookshelf.src}
            excludedShelves={selectedBookshelf.excludedShelves}
          />

          {!isLoading && detectedShelves.length > 0 && (
            <DynamicBookCollection
              key={`books-${key}`}
              shelves={detectedShelves}
              onHover={setHoveredBook}
              onSelect={handleBookSelect}
              selectedBook={selectedBook}
            />
          )}
          <Rug rug="/rugRound.glb" position={[-1,0, 1]} scale={[2, 2, 2]} rotation={[0, 0, 0]} />
          <Computer screen="/loungeSofaCorner.glb" position={[0, 0, -.5]} scale={[2, 2, 2.5]} rotation={[0, 1.6, 0]} />
          <Computer screen="/desk.glb" position={[-1.5, 0, 1.5]} scale={[2, 2, 2.5]} rotation={[0, 1.6, 0]} />

          {/* <PosterCollection /> */}
        </Suspense>
      </Canvas>

      <div
        style={{
          position: "fixed",
          bottom: "1rem",
          left: "1rem",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "0.5rem",
          borderRadius: "12px",
          fontSize: "0.9rem",
          color: "black",
        }}
      >
        <button
          onClick={() => setIsEditMode(true)}
          className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Edit Room
        </button>
        
        {isEditMode && (
          <EditUI
            selectedBookshelf={selectedBookshelf}
            onSelectBookshelf={handleSelectBookshelf}
            onClose={() => setIsEditMode(false)}
          />
        )}
        
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4">Loading bookshelf...</div>
          </div>
        )}
        
        <BookInfo
          hoveredBook={hoveredBook}
          selectedBook={selectedBook}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}

export default App;