import React, { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

const Piano = (props) => {
    const { scene } = useGLTF('/piano_with_chair.glb')  
    return <primitive object={scene} {...props} castShadow />
  }

// Optional: Preload the model
useGLTF.preload('/piano_with_chair.glb')

export default Piano