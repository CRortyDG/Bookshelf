import React, { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

const Bookshelf = (props) => {
    const { scene } = useGLTF('/bookshelf.glb')  
    return <primitive object={scene} {...props} castShadow />
  }

const SmallBookshelf = (props) => {
    const { scene } = useGLTF('/four_tier_stand_shelf.glb')  
    return <primitive object={scene} {...props} castShadow />
  }

// Optional: Preload the model
useGLTF.preload('/bookshelf.glb')

export default Bookshelf
export { SmallBookshelf }