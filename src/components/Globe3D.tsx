'use client'

import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sphere, useTexture } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { uvToLatLong } from '@/lib/globe-utils'

interface Globe3DProps {
  onRegionSelect?: (lat: number, long: number) => void
  drawingsTexture?: THREE.Texture
}

function GlobeMesh({
  onRegionSelect,
  drawingsTexture
}: {
  onRegionSelect?: (lat: number, long: number) => void
  drawingsTexture?: THREE.Texture
}) {
  // Use a hosted earth texture (or put earth-8k.jpg in public/textures/ for a local 8k map)
  const earthTexture = useTexture(
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
  )
  const meshRef = useRef<THREE.Mesh>(null)
  const overlayRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)

  const geometry = useMemo(() => new THREE.SphereGeometry(5, 64, 64), [])

  useFrame(() => {
    if (!isDragging && meshRef.current) {
      meshRef.current.rotation.y += 0.0008
      if (overlayRef.current) {
        overlayRef.current.rotation.y = meshRef.current.rotation.y
      }
    }
  })

  const handlePointerDown = () => setIsDragging(true)
  const handlePointerUp = () => setIsDragging(false)

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!event.uv) return
    const { lat, long } = uvToLatLong(event.uv.x, event.uv.y)
    onRegionSelect?.(lat, long)
  }

  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <meshStandardMaterial map={earthTexture} />
      </mesh>
      {drawingsTexture ? (
        <mesh ref={overlayRef} geometry={geometry} scale={[1.001, 1.001, 1.001]}>
          <meshStandardMaterial map={drawingsTexture} transparent opacity={0.95} />
        </mesh>
      ) : null}
    </>
  )
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
    </>
  )
}

function Controls() {
  const { camera, gl } = useThree()
  return (
    <OrbitControls
      args={[camera, gl.domElement]}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={20}
    />
  )
}

export default function Globe3D({ onRegionSelect, drawingsTexture }: Globe3DProps) {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 45 }} style={{ width: '100%', height: '100vh' }}>
      <Lighting />
      <GlobeMesh onRegionSelect={onRegionSelect} drawingsTexture={drawingsTexture} />
      <Controls />
    </Canvas>
  )
}
