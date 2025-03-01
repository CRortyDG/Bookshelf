import React, { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

const Chair = (props) => {
    const { scene } = useGLTF('/leather_chairgltf.glb')  
    return <primitive object={scene} {...props} castShadow />
  }

// Optional: Preload the model
useGLTF.preload('/leather_chairgltf.glb')

export default Chair