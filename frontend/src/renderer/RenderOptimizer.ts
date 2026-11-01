import * as THREE from 'three';

export class RenderOptimizer {
  public static optimizeScene(scene: THREE.Scene): void {
    scene.traverse((obj: THREE.Object3D) => {
      // Disable auto matrix updates on non-animated static meshes
      if (obj instanceof THREE.Mesh && !(obj as any).isSkinnedMesh && obj.children.length === 0) {
        obj.matrixAutoUpdate = false;
        obj.updateMatrix();
      }

      // Enforce frustum culling
      obj.frustumCulled = true;
    });
  }

  public static disposeHierarchy(obj: THREE.Object3D): void {
    obj.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });
  }
}
