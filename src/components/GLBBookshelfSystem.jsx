import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { Book } from "./Book";
import { cmsData } from "./booksData";

class GLBBookshelfSystem {
  constructor(config = {}) {
    this.shelfDetectionConfig = {
      minShelfWidth: 0.0001,
      heightTolerance: 0.02,
      minShelfDepth: 0.15,
      mergeThreshold: 0.05,
      // Add offset configuration
      offsets: {
        x: 0, // Offset in x-direction
        y: 0, // Offset in y-direction (height)
        z: 0, // Offset in z-direction
      },
      excludedShelves: config.excludedShelves || [],
    };
  }

  setShelfOffsets(xOffset = 0, yOffset = 0, zOffset = 0) {
    this.shelfDetectionConfig.offsets = {
      x: xOffset,
      y: yOffset,
      z: zOffset,
    };
  }

  setExcludedShelves(excludedShelves) {
    this.shelfDetectionConfig.excludedShelves = excludedShelves;
  }

  processGLTFScene(scene) {
    const shelves = [];
    const worldMatrix = new THREE.Matrix4();

    scene.traverse((node) => {
      if (node.isMesh) {
        node.updateWorldMatrix(true, false);
        worldMatrix.copy(node.matrixWorld);
        const meshShelves = this.processMesh(node, worldMatrix);
        shelves.push(...meshShelves);
      }
    });

    // Merge nearby shelves before organizing
    const mergedShelves = this.mergeShelves(shelves);
    const organizedShelves = this.organizeShelves(mergedShelves);

    // Filter out excluded shelves
    return this.filterExcludedShelves(organizedShelves);
  }

  filterExcludedShelves(shelves) {
    if (!this.shelfDetectionConfig.excludedShelves.length) {
      return shelves;
    }

    return shelves.filter((shelf, index) => {
      // Check if this shelf's index is in the excluded shelves array
      return !this.shelfDetectionConfig.excludedShelves.includes(index);
    });
  }

  mergeShelves(shelves) {
    if (shelves.length === 0) return [];

    const sortedShelves = [...shelves].sort((a, b) => a.height - b.height);
    const mergedShelves = [];
    let currentShelf = sortedShelves[0];

    for (let i = 1; i < sortedShelves.length; i++) {
      const nextShelf = sortedShelves[i];
      // More aggressive height merging for close shelves
      if (Math.abs(currentShelf.height - nextShelf.height) < 0.05) {
        currentShelf = this.mergeShelfBounds(currentShelf, nextShelf);
      } else {
        mergedShelves.push(currentShelf);
        currentShelf = nextShelf;
      }
    }

    mergedShelves.push(currentShelf);
    console.log(`Merged ${shelves.length} initial shelves into ${mergedShelves.length} final shelves`);
    return mergedShelves;
  }

  areShelvesOverlapping(bounds1, bounds2) {
    return !(
      bounds1.max.x < bounds2.min.x ||
      bounds1.min.x > bounds2.max.x ||
      bounds1.max.z < bounds2.min.z ||
      bounds1.min.z > bounds2.max.z
    );
  }

  mergeShelfBounds(shelf1, shelf2) {
    const mergedBounds = {
      min: new THREE.Vector3(
        Math.min(shelf1.bounds.min.x, shelf2.bounds.min.x),
        Math.min(shelf1.bounds.min.y, shelf2.bounds.min.y),
        Math.min(shelf1.bounds.min.z, shelf2.bounds.min.z)
      ),
      max: new THREE.Vector3(
        Math.max(shelf1.bounds.max.x, shelf2.bounds.max.x),
        Math.max(shelf1.bounds.max.y, shelf2.bounds.max.y),
        Math.max(shelf1.bounds.max.z, shelf2.bounds.max.z)
      ),
    };

    return {
      height: (shelf1.height + shelf2.height) / 2, // Average height
      bounds: mergedBounds,
      usableSpace: this.calculateUsableSpace(mergedBounds),
      originalMesh: shelf1.originalMesh, // Keep reference to one of the original meshes
    };
  }

  processMesh(mesh, worldMatrix) {
    const shelves = [];
    const geometry = mesh.geometry;

    if (!geometry.attributes.position) return shelves;

    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;

    const worldPositions = new Float32Array(position.array.length);
    const worldNormals = new Float32Array(normal.array.length);

    const pos = new THREE.Vector3();
    const norm = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);

    // Apply offsets during position transformation
    const {
      x: xOffset,
      y: yOffset,
      z: zOffset,
    } = this.shelfDetectionConfig.offsets;

    // Transform vertices to world space with offsets
    for (let i = 0; i < position.count; i++) {
      pos.fromBufferAttribute(position, i);
      pos.applyMatrix4(worldMatrix);

      // Apply offsets to transformed positions
      worldPositions[i * 3] = pos.x + xOffset;
      worldPositions[i * 3 + 1] = pos.y + yOffset;
      worldPositions[i * 3 + 2] = pos.z + zOffset;

      norm.fromBufferAttribute(normal, i);
      norm.applyMatrix3(normalMatrix);
      worldNormals[i * 3] = norm.x;
      worldNormals[i * 3 + 1] = norm.y;
      worldNormals[i * 3 + 2] = norm.z;
    }

    const horizontalSurfaces = this.groupHorizontalSurfaces(
      worldPositions,
      worldNormals,
      position.count
    );

    horizontalSurfaces.forEach((vertices, heightKey) => {
      const bounds = this.calculateBounds(vertices, worldPositions);

      if (this.isValidShelf(bounds)) {
        shelves.push({
          height:
            heightKey * this.shelfDetectionConfig.heightTolerance + yOffset,
          bounds: bounds,
          usableSpace: this.calculateUsableSpace(bounds),
          originalMesh: mesh,
          // Add offset information to shelf data
          appliedOffsets: { ...this.shelfDetectionConfig.offsets },
        });
      }
    });

    return shelves;
  }

  groupHorizontalSurfaces(positions, normals, vertexCount) {
    const surfaces = new Map();
    let foundVertices = 0;

    for (let i = 0; i < vertexCount; i++) {
      const normalY = normals[i * 3 + 1];

      // Looking for perfectly vertical normals (1.0)
      if (normalY > 0.99) {  // Changed from 0.95 to catch perfect verticals
        const height = positions[i * 3 + 1];
        // Use a more forgiving height grouping
        const key = Math.round(height / this.shelfDetectionConfig.heightTolerance);
        
        if (!surfaces.has(key)) {
          surfaces.set(key, []);
        }
        surfaces.get(key).push(i);
        foundVertices++;
      }
    }

    console.log(`Found ${foundVertices} upward-facing vertices across ${surfaces.size} height groups`);
    return surfaces;
  }

  calculateBounds(vertices, positions) {
    const bounds = {
      min: new THREE.Vector3(Infinity, Infinity, Infinity),
      max: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
    };

    vertices.forEach((index) => {
      const x = positions[index * 3];
      const y = positions[index * 3 + 1];
      const z = positions[index * 3 + 2];

      bounds.min.x = Math.min(bounds.min.x, x);
      bounds.min.y = Math.min(bounds.min.y, y);
      bounds.min.z = Math.min(bounds.min.z, z);

      bounds.max.x = Math.max(bounds.max.x, x);
      bounds.max.y = Math.max(bounds.max.y, y);
      bounds.max.z = Math.max(bounds.max.z, z);
    });

    return bounds;
  }

  isValidShelf(bounds) {
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.z - bounds.min.z;

    return (
      width >= this.shelfDetectionConfig.minShelfWidth &&
      depth >= this.shelfDetectionConfig.minShelfDepth
    );
  }

  calculateUsableSpace(bounds) {
    const margin = 0.05;
    return {
      width: bounds.max.x - bounds.min.x - margin * 2,
      depth: bounds.max.z - bounds.min.z - margin,
    };
  }

  organizeShelves(shelves) {
    return shelves.sort((a, b) => a.height - b.height);
  }

  getShelfPositions() {
    return this.shelves.map((shelf) => ({
      height: shelf.height,
      bounds: shelf.bounds,
      appliedOffsets: shelf.appliedOffsets,
    }));
  }
}

// DynamicBookshelf component with fixes
const DynamicBookshelf = React.memo(
  ({
    position = [0, 0, 0],
    scale = [1, 1, 1],
    onShelvesDetected,
    bookshelfSrc = "/wooden_bookshelf_vmhndfu_high.glb",
    excludedShelves = [],
  }) => {
    const gltf = useGLTF(bookshelfSrc);
    const [isProcessing, setIsProcessing] = useState(false);

    // Clone the scene to avoid sharing state between instances
    const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

    useEffect(() => {
      setIsProcessing(true);

      // Use a small timeout to ensure the scene is properly loaded
      const timer = setTimeout(() => {
        const system = new GLBBookshelfSystem({
          excludedShelves: excludedShelves,
        });

        const detectedShelves = system.processGLTFScene(scene);

        if (onShelvesDetected) {
          onShelvesDetected(detectedShelves);
        }

        setIsProcessing(false);
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }, [scene, onShelvesDetected, excludedShelves, bookshelfSrc]);

    // Cleanup function to dispose of materials and geometries
    useEffect(() => {
      return () => {
        scene.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
            if (child.material.dispose) {
              child.material.dispose();
            }
          }
        });
      };
    }, [scene]);

    return (
      <group position={position} scale={scale}>
        <primitive object={scene} castShadow />
      </group>
    );
  }
);

const DynamicBookCollection = React.memo(
    ({ shelves, onHover, onSelect, selectedBook }) => {
      const BOOK_WIDTH = 0.045;
      const BOOK_HEIGHT = 0.25; // Adding explicit book height constant
      const SHELF_MARGIN = 0.01;
  
      const books = useMemo(() => {
        if (!shelves || shelves.length === 0) {
          return [];
        }
  
        const bookPositions = [];
        let cmsDataIndex = 0;
  
        // Calculate all possible positions first
        shelves.forEach((shelf, shelfIndex) => {
          const availableWidth = shelf.usableSpace.width - SHELF_MARGIN * 2;
          const booksPerShelf = Math.floor(availableWidth / BOOK_WIDTH);
          const totalBooksWidth = booksPerShelf * BOOK_WIDTH;
          const startX =
            shelf.bounds.min.x + (shelf.usableSpace.width - totalBooksWidth) / 2;
  
          for (
            let bookIndex = 0;
            bookIndex < booksPerShelf && cmsDataIndex < cmsData.length;
            bookIndex++
          ) {
            const seed = shelfIndex * 1000 + bookIndex;
            const pseudoRandom = () => {
              const x = Math.sin(seed) * 10000;
              return x - Math.floor(x);
            };
  
            const randomRotation = pseudoRandom() * 0.01 - 0.005;
            const randomScale = 1 + pseudoRandom() * 0.25;
            const xPosition = startX + bookIndex * BOOK_WIDTH;
  
            // Only add the book if we still have CMS data available
            if (cmsDataIndex < cmsData.length) {
              bookPositions.push({
                position: [
                  xPosition,
                  shelf.height + (BOOK_HEIGHT * randomScale) / 1.05 + pseudoRandom() * 0.001, // Adjusted Y position to account for book height
                  shelf.bounds.min.z + shelf.usableSpace.depth / 2,
                ],
                rotation: [0, randomRotation, Math.PI],
                scale: [1.25, randomScale, 1.75],
                bookData: {
                  ...cmsData[cmsDataIndex],
                  shelfIndex,
                  bookIndex,
                },
              });
              cmsDataIndex++;
            }
          }
        });
        console.log("bookPositions", bookPositions);
        return bookPositions;
      }, [shelves]); // Only recalculate when shelves change
  
      const handleHover = useCallback(
        (bookData) => {
          if (onHover) {
            onHover(bookData);
          }
        },
        [onHover]
      );
  
      const handleSelect = useCallback(
        (bookData) => {
          if (onSelect) {
            onSelect(bookData);
          }
        },
        [onSelect]
      );
  
      return (
        <group>
          {books.map((book, index) => {
            const bookKey = `book-${book.bookData.shelfIndex}-${book.bookData.bookIndex}`;
            return (
              <Book
                key={bookKey}
                {...book}
                onHover={handleHover}
                onSelect={handleSelect}
                selected={selectedBook?.title === book.bookData.title}
              />
            );
          })}
        </group>
      );
    }
  );

export { DynamicBookshelf, DynamicBookCollection };
