import React, { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

const scale = [0.4, 0.4, 0.4];

const Plant = ({ position = [4, 0, -3], ...props }) => {
    const { scene } = useGLTF('/potted_monstera_plant.glb')
    return <primitive object={scene} position={position} {...props} castShadow scale={scale}/>
}

// Optional: Preload the model
useGLTF.preload('/potted_monstera_plant.glb')

export default Plant