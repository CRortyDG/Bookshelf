import React, { useRef, useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { cmsData } from "./booksData";
import { generateBookId, calculateBookPosition, SHELF_CONFIG } from "./util";

const createBookMaterial = async (texturePath) => {
    const finalTexturePath = texturePath || (() => {
        const numCovers = 8;
        const randomIndex = Math.floor(Math.random() * numCovers) + 1;
        return `/bookcovers/cover${randomIndex}.jpeg`;
    })();

    try {
        const texture = await new THREE.TextureLoader().loadAsync(finalTexturePath);
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.2,
            metalness: 0,
            color: 0xffffff,
            emissive: 0x000000,
            normalScale: new THREE.Vector2(1, 1),
            envMapIntensity: 1,
        });
    } catch (error) {
        console.error(`Failed to load texture ${finalTexturePath}:`, error);
        return null;
    }
};

function Book({
    position,
    rotation = [0, 0, 0],
    scale = [10, 10, 10],
    onHover,
    onSelect,
    bookData,
    isSelected,
    selectedBookExists,
}) {
    const { scene } = useGLTF("/book_wldobay_high.glb");
    const [hovered, setHovered] = useState(false);
    const [bookScene, setBookScene] = useState(null);
    const modelRef = useRef();

    // Create a deep clone of the scene when the component mounts
    useEffect(() => {
        const clonedScene = scene.clone(true);
        setBookScene(clonedScene);
    }, [scene]);

    // Apply materials to the cloned scene
    useEffect(() => {
        if (!bookScene) return;

        const applyMaterial = async () => {
            const material = await createBookMaterial(bookData.texture);
            
            bookScene.traverse((child) => {
                if (child.isMesh) {
                    if (material) {
                        // Create a new instance of the material for each mesh
                        child.material = material.clone();
                    } else {
                        // If no custom texture, clone the original material
                        child.material = child.material.clone();
                    }
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        };

        applyMaterial();
    }, [bookScene, bookData.texture]);

    const { tiltRotation, hoverPosition } = useSpring({
        tiltRotation:
            (hovered && !selectedBookExists) || isSelected
                ? [0.3, rotation[1], rotation[2]] // Remove the tilt by setting first value to 0
                : [0, rotation[1], rotation[2]],
        hoverPosition:
            (hovered && !selectedBookExists) || isSelected
                ? [
                    position[0], // Keep X exactly the same
                    position[1], // Keep Y exactly the same
                    position[2] + 0.3  // Only move on Z axis
                  ]
                : position,
        config: { mass: 2, tension: 180, friction: 28 },
    });

    const handlePointerOver = (e) => {
        e.stopPropagation();
        if (!selectedBookExists) {
            setHovered(true);
            if (onHover) onHover(bookData);
        }
    };

    const handlePointerOut = (e) => {
        e.stopPropagation();
        if (!selectedBookExists) {
            setHovered(false);
            if (onHover) onHover(null);
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (onSelect) onSelect(bookData);
    };

    if (!bookScene) return null;

    return (
        <animated.group
            position={hoverPosition}
            rotation={tiltRotation}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
            ref={modelRef}
        >
            <primitive object={bookScene} scale={scale} />
        </animated.group>
    );
}

function BookCollection({ onHover, onSelect, selectedBook }) {
    const bookScale = [1.75, 1.75, 1.75];
    const [booksFromCMS, setBooksFromCMS] = useState([]);

    useEffect(() => {
        const booksWithPositions = cmsData.map((book, index) => {
            const { position, rotation, shelfIndex } = calculateBookPosition(index, cmsData.length);
            return {
                ...book,
                id: generateBookId(book.title, book.author),
                position,
                rotation,
                shelfIndex,
                bookIndex: index
            };
        });

        setBooksFromCMS(booksWithPositions);
    }, []);

    return (
        <group>
            {booksFromCMS.map((bookData, index) => (
                <Book
                    key={bookData.shelfIndex + "-" + bookData.bookIndex}
                    position={bookData.position}
                    rotation={bookData.rotation}
                    scale={bookScale}
                    onHover={onHover}
                    onSelect={onSelect}
                    bookData={bookData}
                    isSelected={selectedBook?.id === bookData.id}
                    selectedBookExists={!!selectedBook}
                />
            ))}
        </group>
    );
}

useGLTF.preload("/ParableOfTheSower.glb");

export { Book, BookCollection, SHELF_CONFIG };