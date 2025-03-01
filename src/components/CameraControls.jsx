import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function CameraControls({ setControlsTarget }) {
  const { camera } = useThree();
  const moveSpeed = 0.2;

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = new THREE.Vector3();
      const right = new THREE.Vector3();
      const forward = new THREE.Vector3();

      camera.getWorldDirection(forward);
      right.crossVectors(camera.up, forward).normalize();

      switch (event.key.toLowerCase()) {
        case "a": // Move left
          direction.copy(right).multiplyScalar(moveSpeed);
          break;
        case "d": // Move right
          direction.copy(right).multiplyScalar(-moveSpeed);
          break;
        case "w": // Move forward
          direction.copy(forward).multiplyScalar(moveSpeed);
          break;
        case "s": // Move backward
          direction.copy(forward).multiplyScalar(-moveSpeed);
          break;
        case "arrowup": // Move up
          direction.set(0, moveSpeed, 0);
          break;
        case "arrowdown": // Move down
          direction.set(0, -moveSpeed, 0);
          break;
        default:
          return;
      }

      // Update camera position
      camera.position.add(direction);

      // Update OrbitControls target to maintain relative position
      setControlsTarget((prev) => [
        prev[0] + direction.x,
        prev[1] + direction.y,
        prev[2] + direction.z,
      ]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [camera, moveSpeed, setControlsTarget]);

  return null;
}