import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { BoundingBox3, MeshGeometryData, OverhangFace, PrinterProfile } from "@layerai/shared-types";
import { buildBedPlate } from "./build-bed-plate.js";
import { buildDisplayGeometry } from "./build-display-geometry.js";
import { buildInfillTexture } from "./infill-texture.js";

export interface LayerViewState {
  heightMm: number;
  fillPattern: string;
}

interface Viewer3DProps {
  printer: PrinterProfile | undefined;
  geometry: MeshGeometryData | null;
  overhangFaces: OverhangFace[];
  boundingBoxMm: BoundingBox3 | null;
  layerView: LayerViewState | null;
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  bedGroup: THREE.Group | null;
  modelGroup: THREE.Group;
  meshObject: THREE.Mesh | null;
  capMesh: THREE.Mesh | null;
  clippingPlane: THREE.Plane;
  animationHandle: number;
}

function bedCenterOf(printer: PrinterProfile): { x: number; y: number } {
  const minX = Math.min(...printer.bedShape.map((p) => p.x));
  const maxX = Math.max(...printer.bedShape.map((p) => p.x));
  const minY = Math.min(...printer.bedShape.map((p) => p.y));
  const maxY = Math.max(...printer.bedShape.map((p) => p.y));
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export function Viewer3D({ printer, geometry, overhangFaces, boundingBoxMm, layerView }: Viewer3DProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<SceneRefs | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0b0d");

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 5000);
    camera.up.set(0, 0, 1);
    camera.position.set(300, -300, 260);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;

    const hemiLight = new THREE.HemisphereLight("#ffffff", "#22222a", 1.1);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight("#ffffff", 1.2);
    dirLight.position.set(200, -300, 400);
    scene.add(dirLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const sceneRefs: SceneRefs = {
      renderer,
      scene,
      camera,
      controls,
      bedGroup: null,
      modelGroup,
      meshObject: null,
      capMesh: null,
      clippingPlane: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
      animationHandle: 0,
    };
    refs.current = sceneRefs;

    const resize = (): void => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const animate = (): void => {
      controls.update();
      renderer.render(scene, camera);
      sceneRefs.animationHandle = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(sceneRefs.animationHandle);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      refs.current = null;
    };
  }, []);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs || !printer) return;

    if (sceneRefs.bedGroup) {
      sceneRefs.scene.remove(sceneRefs.bedGroup);
    }
    const bedGroup = buildBedPlate(printer);
    sceneRefs.scene.add(bedGroup);
    sceneRefs.bedGroup = bedGroup;

    const center = bedCenterOf(printer);
    sceneRefs.modelGroup.position.set(center.x, center.y, 0);

    const bedWidth = Math.max(...printer.bedShape.map((p) => p.x));
    const bedDepth = Math.max(...printer.bedShape.map((p) => p.y));
    sceneRefs.controls.target.set(center.x, center.y, printer.maxPrintHeightMm / 4);
    sceneRefs.camera.position.set(bedWidth * 1.1, -bedDepth * 1.1, bedWidth * 0.9);
  }, [printer]);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs) return;

    if (sceneRefs.meshObject) {
      sceneRefs.modelGroup.remove(sceneRefs.meshObject);
      sceneRefs.meshObject.geometry.dispose();
      (sceneRefs.meshObject.material as THREE.Material).dispose();
      sceneRefs.meshObject = null;
    }
    if (!geometry) return;

    const displayGeometry = buildDisplayGeometry(geometry, overhangFaces);
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(displayGeometry, material);
    mesh.castShadow = true;
    sceneRefs.modelGroup.add(mesh);
    sceneRefs.meshObject = mesh;
  }, [geometry, overhangFaces]);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs) return;

    if (sceneRefs.capMesh) {
      sceneRefs.modelGroup.remove(sceneRefs.capMesh);
      sceneRefs.capMesh.geometry.dispose();
      (sceneRefs.capMesh.material as THREE.Material).dispose();
      sceneRefs.capMesh = null;
    }

    const meshMaterial = sceneRefs.meshObject?.material as THREE.MeshStandardMaterial | undefined;

    if (!layerView || !boundingBoxMm || !meshMaterial) {
      if (meshMaterial) meshMaterial.clippingPlanes = [];
      return;
    }

    // The clipping plane clips in world space, but the model sits inside a translated group -
    // offset the plane constant by the group's Z position (currently always 0, kept explicit
    // for correctness if the model group ever gains a Z offset).
    sceneRefs.clippingPlane.constant = layerView.heightMm + sceneRefs.modelGroup.position.z;
    meshMaterial.clippingPlanes = [sceneRefs.clippingPlane];

    const width = Math.max(1, boundingBoxMm.max.x - boundingBoxMm.min.x);
    const depth = Math.max(1, boundingBoxMm.max.y - boundingBoxMm.min.y);
    const texture = buildInfillTexture(layerView.fillPattern);
    texture.repeat.set(width / 15, depth / 15);

    const capGeometry = new THREE.PlaneGeometry(width, depth);
    const capMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const capMesh = new THREE.Mesh(capGeometry, capMaterial);
    capMesh.position.set((boundingBoxMm.min.x + boundingBoxMm.max.x) / 2, (boundingBoxMm.min.y + boundingBoxMm.max.y) / 2, layerView.heightMm);
    sceneRefs.modelGroup.add(capMesh);
    sceneRefs.capMesh = capMesh;
  }, [layerView, boundingBoxMm]);

  return <div ref={containerRef} className="h-full w-full" />;
}
