import React, { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

const Desk = (props) => {
    const { scene } = useGLTF('/wooden_desk.glb')  
    return <primitive object={scene} {...props} castShadow />
  }

// Optional: Preload the model
useGLTF.preload('/wooden_desk.glb')

export default Desk