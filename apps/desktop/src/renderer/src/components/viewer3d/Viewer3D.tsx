import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { MeshGeometryData, OverhangFace, PrinterProfile } from "@layerai/shared-types";
import { buildBedPlate } from "./build-bed-plate.js";
import { buildDisplayGeometry } from "./build-display-geometry.js";

interface Viewer3DProps {
  printer: PrinterProfile | undefined;
  geometry: MeshGeometryData | null;
  overhangFaces: OverhangFace[];
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  bedGroup: THREE.Group | null;
  meshObject: THREE.Mesh | null;
  animationHandle: number;
}

export function Viewer3D({ printer, geometry, overhangFaces }: Viewer3DProps): React.JSX.Element {
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
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;

    const hemiLight = new THREE.HemisphereLight("#ffffff", "#22222a", 1.1);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight("#ffffff", 1.2);
    dirLight.position.set(200, -300, 400);
    scene.add(dirLight);

    const sceneRefs: SceneRefs = { renderer, scene, camera, controls, bedGroup: null, meshObject: null, animationHandle: 0 };
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

    const bedWidth = Math.max(...printer.bedShape.map((p) => p.x));
    const bedDepth = Math.max(...printer.bedShape.map((p) => p.y));
    sceneRefs.controls.target.set(bedWidth / 2, bedDepth / 2, printer.maxPrintHeightMm / 4);
    sceneRefs.camera.position.set(bedWidth * 1.1, -bedDepth * 1.1, bedWidth * 0.9);
  }, [printer]);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs) return;

    if (sceneRefs.meshObject) {
      sceneRefs.scene.remove(sceneRefs.meshObject);
      sceneRefs.meshObject.geometry.dispose();
      (sceneRefs.meshObject.material as THREE.Material).dispose();
      sceneRefs.meshObject = null;
    }
    if (!geometry) return;

    const displayGeometry = buildDisplayGeometry(geometry, overhangFaces);
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(displayGeometry, material);
    mesh.castShadow = true;
    sceneRefs.scene.add(mesh);
    sceneRefs.meshObject = mesh;
  }, [geometry, overhangFaces]);

  return <div ref={containerRef} className="h-full w-full" />;
}
