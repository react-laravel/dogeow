declare module 'three-stdlib' {
  import * as THREE from 'three'
  export class PointerLockControls extends THREE.EventDispatcher {
    constructor(camera: THREE.Camera, domElement?: HTMLElement)
    connect(): void
    disconnect(): void
    dispose(): void
    lock(): void
    unlock(): void
    getObject(): THREE.Object3D | null
    getDirection(): THREE.Vector3
    isLocked: boolean
  }
}
