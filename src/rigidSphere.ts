import * as THREE from "three";
import { randomColor } from "./util/color";

// ===================== BOUNDARY =====================

const bound = 5.0;
const bound_num = 5;

const boundPositions = [
  new THREE.Vector3(0.0, 0.0, 0.0), // grond
  new THREE.Vector3(bound, 0.0, 0.0), // maxX
  new THREE.Vector3(-bound, 0.0, 0.0), // minX
  new THREE.Vector3(0.0, 0.0, bound), // maxZ
  new THREE.Vector3(0.0, 0.0, -bound), // minZ
];
const boundNormals = [
  new THREE.Vector3(0.0, 1.0, 0.0), // grond
  new THREE.Vector3(-1.0, 0.0, 0.0), // maxX
  new THREE.Vector3(1.0, 0.0, 0.0), // minX
  new THREE.Vector3(0.0, 0.0, -1.0), // maxZ
  new THREE.Vector3(0.0, 0.0, 1.0), // minZ
];

// ===================== RIGIDSPHERE =====================

export class RigidSphereObject {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  inv_mass: number;
  mesh: THREE.Mesh;
  radius: number;

  constructor(radius_: number, scene_: THREE.Scene) {
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.radius = radius_;
    this.inv_mass = (4 * Math.PI) / this.radius ** 3;

    const color = randomColor();
    const sphereGeo = new THREE.SphereGeometry(this.radius);
    const sphereMat = new THREE.MeshPhongMaterial({ color });
    this.mesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene_.add(this.mesh);
  }

  renderUpdate() {
    this.mesh.position.copy(this.position);
  }

  applyStates(dt: number, gravity: number) {
    this.velocity.add(new THREE.Vector3(0, -gravity * dt, 0));
    this.position.add(this.velocity.clone().multiplyScalar(dt));
  }
  
  handleBoundaries() {
    const restitution = 0.5;
    for (let k = 0; k < bound_num; k++) {
      const gap = this.position.clone().sub(boundPositions[k]).dot(boundNormals[k]) - this.radius;
      const proj = this.velocity.dot(boundNormals[k]);
      if (gap < 0.01 && proj < 0) {
        this.velocity.add(boundNormals[k].clone().multiplyScalar(-proj * (1 + restitution)));
      }
      if (gap < 0) {
        this.position.add(boundNormals[k].clone().multiplyScalar(-gap));
      }
    }
  }

  grabInteract(dt: number, target: THREE.Vector3, id: number) {
    const updateRatio = 0.1;
    const prevPosition = this.position.clone();
    this.position.copy(target);
    const instant = this.position
      .clone()
      .sub(prevPosition)
      .multiplyScalar(1 / dt);
    instant.multiplyScalar(updateRatio);
    this.velocity.multiplyScalar(1 - updateRatio);
    this.velocity.add(instant);
  }

  initLocation(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.renderUpdate();
  }

  remove(scene: THREE.Scene) {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    scene.remove(this.mesh);
  }
}
