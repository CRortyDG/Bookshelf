import React, { useState, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { Grid, Box } from '@react-three/drei';
import * as THREE from 'three';

// Room Constants from your existing code
const ROOM_WIDTH = 5;
const ROOM_HEIGHT = 4;
const ROOM_DEPTH = 5;

// Grid settings for better placement
const GRID_SIZE = 0.5; // Size of grid squares

const AVAILABLE_ITEMS = {
  bookshelf: {
    name: 'Bookshelf',
    model: '/wooden_bookshelf_vmhndfu_high.glb',
    defaultScale: [2, 2, 2],
    defaultRotation: [0, 0, 0],
    bounds: { width: 1, height: 2, depth: 0.5 } // Approximate bounds for collision
  },
  chair: {
    name: 'Chair',
    model: '/loungeSofaCorner.glb',
    defaultScale: [2, 2, 2.5],
    defaultRotation: [0, 1.6, 0],
    bounds: { width: 1, height: 1, depth: 1 }
  },
  desk: {
    name: 'Desk',
    model: '/desk.glb',
    defaultScale: [2, 2, 2.5],
    defaultRotation: [0, 0, 0],
    bounds: { width: 1.5, height: 0.75, depth: 0.8 }
  }
};

// Helper function to snap position to grid
const snapToGrid = (value) => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

// Helper function to check bounds
const checkBounds = (position, itemBounds) => {
  const halfWidth = (itemBounds.width * itemBounds.scale[0]) / 2;
  const halfDepth = (itemBounds.depth * itemBounds.scale[2]) / 2;
  
  return {
    x: Math.min(Math.max(position.x, -ROOM_WIDTH/2 + halfWidth), ROOM_WIDTH/2 - halfWidth),
    y: Math.max(position.y, itemBounds.height * itemBounds.scale[1] / 2),
    z: Math.min(Math.max(position.z, -ROOM_DEPTH/2 + halfDepth), ROOM_DEPTH/2 - halfDepth)
  };
};

// SceneObject component - The 3D draggable object
const SceneObject = ({ item, onSelect, selected, onPositionUpdate }) => {
  const mesh = useRef();
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!mesh.current) return;

    const controls = new DragControls([mesh.current], camera, gl.domElement);
    
    controls.addEventListener('dragstart', () => {
      setIsDragging(true);
      onSelect(item);
    });

    controls.addEventListener('drag', (event) => {
      const object = event.object;
      const itemBounds = {
        ...AVAILABLE_ITEMS[item.type].bounds,
        scale: item.scale
      };

      // Snap to grid and check bounds
      const boundedPosition = checkBounds(object.position, itemBounds);
      object.position.x = snapToGrid(boundedPosition.x);
      object.position.y = boundedPosition.y;
      object.position.z = snapToGrid(boundedPosition.z);

      // Update item position
      onPositionUpdate(item.id, [
        object.position.x,
        object.position.y,
        object.position.z
      ]);
    });

    controls.addEventListener('dragend', () => {
      setIsDragging(false);
    });

    return () => {
      controls.dispose();
    };
  }, [camera, gl.domElement, item, onSelect, onPositionUpdate]);

  return (
    <group>
      <mesh
        ref={mesh}
        position={item.position}
        rotation={item.rotation}
        scale={item.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={selected ? '#ff9999' : (isDragging ? '#ffcc99' : '#999999')} 
          transparent={true}
          opacity={0.5}
        />
      </mesh>
      
      {/* Bounding box helper (visible when selected) */}
      {selected && (
        <Box
          args={[
            AVAILABLE_ITEMS[item.type].bounds.width * item.scale[0],
            AVAILABLE_ITEMS[item.type].bounds.height * item.scale[1],
            AVAILABLE_ITEMS[item.type].bounds.depth * item.scale[2]
          ]}
          position={item.position}
          rotation={item.rotation}
        >
          <meshBasicMaterial wireframe color="red" />
        </Box>
      )}
    </group>
  );
};

// Scene Controller Component
const SceneController = ({ items, selectedItem, onSelectItem, onUpdateItem }) => {
  return (
    <group>
      {/* Visual grid helper */}
      <Grid
        infiniteGrid
        cellSize={GRID_SIZE}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={GRID_SIZE * 2}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
        position={[0, 0.01, 0]}
      />
      
      {/* Scene objects */}
      {items.map(item => (
        <SceneObject
          key={item.id}
          item={item}
          selected={selectedItem?.id === item.id}
          onSelect={onSelectItem}
          onPositionUpdate={(id, position) => {
            onUpdateItem({ ...item, position });
          }}
        />
      ))}
    </group>
  );
};

// UI Component for controls
export const SceneControllerUI = ({ onAddItem, selectedItem, onUpdateItem, onRemoveItem }) => {
  const handleRotate = (axis) => {
    if (!selectedItem) return;
    const rotation = [...selectedItem.rotation];
    rotation[axis] += Math.PI / 2; // Changed to 90-degree rotations for better control
    onUpdateItem({ ...selectedItem, rotation });
  };

  const handleScale = (delta) => {
    if (!selectedItem) return;
    const scale = selectedItem.scale.map(s => Math.max(0.5, Math.min(4, s + delta))); // Limit scale range
    onUpdateItem({ ...selectedItem, scale });
  };

  return (
    <>
      {/* Add Items UI */}
      <div className="fixed top-4 left-4 bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold mb-2">Add Items</h3>
        <div className="space-x-2">
          {Object.entries(AVAILABLE_ITEMS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => onAddItem(key)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Add {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Item Controls */}
      {selectedItem && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">Item Controls</h3>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <button 
                onClick={() => handleRotate(1)} 
                className="bg-blue-500 text-white px-2 py-1 rounded"
              >
                Rotate 90°
              </button>
              <button 
                onClick={() => handleScale(0.25)} 
                className="bg-green-500 text-white px-2 py-1 rounded"
              >
                Scale +
              </button>
              <button 
                onClick={() => handleScale(-0.25)} 
                className="bg-yellow-500 text-white px-2 py-1 rounded"
              >
                Scale -
              </button>
              <button 
                onClick={() => onRemoveItem(selectedItem.id)} 
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { SceneController, AVAILABLE_ITEMS };