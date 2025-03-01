import React, { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const ShelfDebugger = ({ modelPath = '/bookcaseOpen.glb' }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const gltf = useGLTF(modelPath);

  useEffect(() => {
    const scene = gltf.scene.clone();
    const debugData = {
      normalDistribution: new Array(20).fill(0), // Track normal.y distribution in 0.05 increments
      heightGroups: new Map(),
      verticesAboveThreshold: 0
    };

    scene.traverse((node) => {
      if (node.isMesh) {
        const geometry = node.geometry;
        if (!geometry.attributes.position || !geometry.attributes.normal) return;

        const position = geometry.attributes.position;
        const normal = geometry.attributes.normal;
        const worldMatrix = node.matrixWorld;
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);

        for (let i = 0; i < position.count; i++) {
          // Get normal in world space
          const norm = new THREE.Vector3();
          norm.fromBufferAttribute(normal, i);
          norm.applyMatrix3(normalMatrix).normalize();
          
          // Track normal.y distribution
          const normalYBin = Math.floor((norm.y + 1) / 0.1);
          debugData.normalDistribution[normalYBin] = (debugData.normalDistribution[normalYBin] || 0) + 1;
          
          if (norm.y > 0.99) {
            debugData.verticesAboveThreshold++;
            
            // Get position in world space
            const pos = new THREE.Vector3();
            pos.fromBufferAttribute(position, i);
            pos.applyMatrix4(worldMatrix);
            
            // Group by height with 0.02 tolerance
            const heightKey = Math.round(pos.y / 0.02);
            if (!debugData.heightGroups.has(heightKey)) {
              debugData.heightGroups.set(heightKey, []);
            }
            debugData.heightGroups.get(heightKey).push(pos.y);
          }
        }
      }
    });

    setDebugInfo(debugData);
  }, [gltf]);

  if (!debugInfo) return <div>Loading debug info...</div>;

  return (
    <div className="p-4 bg-white/90 rounded shadow max-h-[80vh] overflow-auto">
      <h2 className="text-lg font-bold mb-4">Shelf Detection Debug Info</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Normal.y Distribution</h3>
        <div className="grid grid-cols-2 gap-2">
          {debugInfo.normalDistribution.map((count, i) => (
            <div key={i} className="text-sm">
              {`${(i * 0.1 - 1).toFixed(2)} to ${((i + 1) * 0.1 - 1).toFixed(2)}: ${count}`}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Vertices Above Threshold (0.95)</h3>
        <div>{debugInfo.verticesAboveThreshold}</div>
      </div>

      <div>
        <h3 className="font-semibold">Height Groups</h3>
        {Array.from(debugInfo.heightGroups.entries()).map(([key, heights]) => (
          <div key={key} className="text-sm mb-1">
            {`Height ${(key * 0.02).toFixed(3)}: ${heights.length} vertices`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelfDebugger;