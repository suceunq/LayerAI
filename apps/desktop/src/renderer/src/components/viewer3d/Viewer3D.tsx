import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { BoundingBox3, MeshGeometryData, OverhangFace, PrinterProfile } from "@layerai/shared-types";
import { buildBedPlate } from "./build-bed-plate.js";
import { buildDisplayGeometry } from "./build-display-geometry.js";
import { buildInfillTexture } from "./infill-texture.js";
import { computeSupportColumns, buildSupportPreviewMesh } from "./build-support-preview.js";

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
  facePickModeActive?: boolean;
  onFacePicked?: (normal: { x: number; y: number; z: number }) => void;
  showSupportPreview?: boolean;
  onSurfaceClicked?: (info: { x: number; y: number; overhang: { angleFromHorizontalDeg: number; areaMm2: number } | null }) => void;
  /** Bed-space centers for every copy on the active plate (from computeGridArrangement). Length <= 1 renders exactly like a single part. */
  plateArrangementPositions?: { x: number; y: number }[];
  /** One entry per plate (each in the same untiled bed-space coordinates as plateArrangementPositions) - when this has more than one plate, all plates render tiled side by side instead of just the active one. */
  allPlatesPositions?: { x: number; y: number }[][];
  /** Which entry of allPlatesPositions gets the real interactive mesh; the rest render as ghost-only ("full ghost") plates. */
  activePlateIndex?: number;
  theme?: "dark" | "light";
}

const VIEWER_BACKGROUND: Record<"dark" | "light", string> = { dark: "#0b0b0d", light: "#f4f4f6" };

export interface Viewer3DHandle {
  /** Renders one fresh frame and returns it as a "data:image/png;base64,..." URL, or null if the scene isn't mounted. */
  captureImage: () => string | null;
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
  supportPreviewMesh: THREE.InstancedMesh | null;
  plateGhostMesh: THREE.InstancedMesh | null;
  clippingPlane: THREE.Plane;
  animationHandle: number;
}

/** Horizontal gap left between tiled plates in "see all plates" mode. */
const PLATE_GAP_MM = 40;

function bedCenterOf(printer: PrinterProfile): { x: number; y: number } {
  const minX = Math.min(...printer.bedShape.map((p) => p.x));
  const maxX = Math.max(...printer.bedShape.map((p) => p.x));
  const minY = Math.min(...printer.bedShape.map((p) => p.y));
  const maxY = Math.max(...printer.bedShape.map((p) => p.y));
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

function bedWidthOf(printer: PrinterProfile): number {
  return Math.max(...printer.bedShape.map((p) => p.x)) - Math.min(...printer.bedShape.map((p) => p.x));
}

/** Index of the position in `positions` closest to `target` - used to figure out which grid slot the real (interactive) mesh should occupy. */
function closestPositionIndex(positions: { x: number; y: number }[], target: { x: number; y: number }): number {
  let closestIndex = 0;
  let closestDist = Infinity;
  positions.forEach((p, i) => {
    const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
    if (d < closestDist) {
      closestDist = d;
      closestIndex = i;
    }
  });
  return closestIndex;
}

/** World-space box covering the bed, expanded to also cover the model if it's larger than the bed - an oversized model must never be framed out of view. In "see all plates" mode, expands to cover every tiled plate. */
function computeCombinedBounds(
  printer: PrinterProfile,
  boundingBoxMm: BoundingBox3 | null,
  modelCenter: { x: number; y: number },
  plateArrangementPositions: { x: number; y: number }[] = [],
  allPlatesPositions?: { x: number; y: number }[][]
): { min: THREE.Vector3; max: THREE.Vector3 } {
  const bedWidth = Math.max(...printer.bedShape.map((p) => p.x));
  const bedDepth = Math.max(...printer.bedShape.map((p) => p.y));
  const isOverview = !!allPlatesPositions && allPlatesPositions.length > 1;
  const plateCount = isOverview ? allPlatesPositions!.length : 1;
  const tilePitch = bedWidth + PLATE_GAP_MM;

  const min = new THREE.Vector3(0, 0, 0);
  const max = new THREE.Vector3(bedWidth + (plateCount - 1) * tilePitch, bedDepth, printer.maxPrintHeightMm);
  if (boundingBoxMm) {
    const halfW = (boundingBoxMm.max.x - boundingBoxMm.min.x) / 2;
    const halfD = (boundingBoxMm.max.y - boundingBoxMm.min.y) / 2;
    const centers: { x: number; y: number }[] = [];
    if (isOverview) {
      allPlatesPositions!.forEach((positions, i) => {
        const offsetX = i * tilePitch;
        (positions.length > 0 ? positions : [modelCenter]).forEach((p) => centers.push({ x: p.x + offsetX, y: p.y }));
      });
    } else if (plateArrangementPositions.length > 1) {
      centers.push(...plateArrangementPositions);
    } else {
      centers.push(modelCenter);
    }
    for (const c of centers) {
      min.x = Math.min(min.x, c.x - halfW);
      min.y = Math.min(min.y, c.y - halfD);
      max.x = Math.max(max.x, c.x + halfW);
      max.y = Math.max(max.y, c.y + halfD);
    }
    min.z = Math.min(min.z, boundingBoxMm.min.z);
    max.z = Math.max(max.z, boundingBoxMm.max.z);
  }
  return { min, max };
}

/** Positions the camera so the whole given box is visible, using the smaller of the vertical/horizontal FOV so nothing gets clipped regardless of viewport aspect ratio. */
function frameCameraToFit(sceneRefs: SceneRefs, min: THREE.Vector3, max: THREE.Vector3): void {
  const center = min.clone().add(max).multiplyScalar(0.5);
  const halfExtent = max.clone().sub(min).multiplyScalar(0.5).length();
  const camera = sceneRefs.camera;
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const effectiveFov = camera.aspect >= 1 ? vFov : hFov;
  const distance = Math.max((halfExtent / Math.sin(effectiveFov / 2)) * 1.2, 50);
  const direction = new THREE.Vector3(1.1, -1.1, 0.9).normalize();
  camera.position.copy(center).addScaledVector(direction, distance);
  sceneRefs.controls.target.copy(center);
}

export const Viewer3D = forwardRef<Viewer3DHandle, Viewer3DProps>(function Viewer3D(
  {
    printer,
    geometry,
    overhangFaces,
    boundingBoxMm,
    layerView,
    facePickModeActive = false,
    onFacePicked,
    showSupportPreview = false,
    onSurfaceClicked,
    plateArrangementPositions = [],
    allPlatesPositions,
    activePlateIndex = 0,
    theme = "dark",
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<SceneRefs | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      captureImage: () => {
        const sceneRefs = refs.current;
        if (!sceneRefs) return null;
        sceneRefs.renderer.render(sceneRefs.scene, sceneRefs.camera);
        return sceneRefs.renderer.domElement.toDataURL("image/png");
      },
    }),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VIEWER_BACKGROUND[theme]);

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
      supportPreviewMesh: null,
      plateGhostMesh: null,
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
    if (!sceneRefs) return;
    sceneRefs.scene.background = new THREE.Color(VIEWER_BACKGROUND[theme]);
  }, [theme]);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs || !printer) return;

    if (sceneRefs.bedGroup) {
      sceneRefs.scene.remove(sceneRefs.bedGroup);
    }
    const plateCount = allPlatesPositions && allPlatesPositions.length > 1 ? allPlatesPositions.length : 1;
    const tilePitch = bedWidthOf(printer) + PLATE_GAP_MM;
    const group = new THREE.Group();
    for (let i = 0; i < plateCount; i++) {
      const plate = buildBedPlate(printer, theme);
      plate.position.set(i * tilePitch, 0, 0);
      group.add(plate);
    }
    sceneRefs.scene.add(group);
    sceneRefs.bedGroup = group;
  }, [printer, allPlatesPositions, theme]);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs || !printer) return;
    const center = bedCenterOf(printer);
    const { min, max } = computeCombinedBounds(printer, boundingBoxMm, center, plateArrangementPositions, allPlatesPositions);
    frameCameraToFit(sceneRefs, min, max);
  }, [printer, boundingBoxMm, plateArrangementPositions, allPlatesPositions]);

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

    if (sceneRefs.supportPreviewMesh) {
      sceneRefs.modelGroup.remove(sceneRefs.supportPreviewMesh);
      sceneRefs.supportPreviewMesh.geometry.dispose();
      (sceneRefs.supportPreviewMesh.material as THREE.Material).dispose();
      sceneRefs.supportPreviewMesh = null;
    }
    if (!showSupportPreview || !geometry) return;

    const columns = computeSupportColumns(geometry, overhangFaces);
    const mesh = buildSupportPreviewMesh(columns);
    if (!mesh) return;
    sceneRefs.modelGroup.add(mesh);
    sceneRefs.supportPreviewMesh = mesh;
  }, [geometry, overhangFaces, showSupportPreview]);

  // Positions the interactive mesh on its grid slot (fixing it to a raw bed-center would drift
  // away from the actual slot whenever the grid has an even row/column count, overlapping
  // neighboring ghost copies) and renders every other copy - on every tiled plate when in "see
  // all plates" mode - as non-interactive ghost instances.
  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs) return;

    if (sceneRefs.plateGhostMesh) {
      sceneRefs.scene.remove(sceneRefs.plateGhostMesh);
      if (sceneRefs.plateGhostMesh.geometry !== sceneRefs.meshObject?.geometry) sceneRefs.plateGhostMesh.geometry.dispose();
      (sceneRefs.plateGhostMesh.material as THREE.Material).dispose();
      sceneRefs.plateGhostMesh = null;
    }
    if (!printer) return;

    const isOverview = !!allPlatesPositions && allPlatesPositions.length > 1;
    const plates = isOverview ? allPlatesPositions! : [plateArrangementPositions];
    const activeIdx = isOverview ? Math.min(Math.max(activePlateIndex, 0), plates.length - 1) : 0;
    const tilePitch = bedWidthOf(printer) + PLATE_GAP_MM;
    const bedCenter = bedCenterOf(printer);

    const ghostPositions: { x: number; y: number }[] = [];
    plates.forEach((positions, plateIdx) => {
      const tileOffsetX = plateIdx * tilePitch;
      if (plateIdx === activeIdx) {
        const target = { x: bedCenter.x + tileOffsetX, y: bedCenter.y };
        if (positions.length > 0) {
          const closestIndex = closestPositionIndex(positions, target);
          const modelSlot = positions[closestIndex]!;
          sceneRefs.modelGroup.position.set(modelSlot.x + tileOffsetX, modelSlot.y, 0);
          positions.forEach((p, i) => {
            if (i !== closestIndex) ghostPositions.push({ x: p.x + tileOffsetX, y: p.y });
          });
        } else {
          sceneRefs.modelGroup.position.set(target.x, target.y, 0);
        }
      } else {
        positions.forEach((p) => ghostPositions.push({ x: p.x + tileOffsetX, y: p.y }));
      }
    });

    if (!geometry || ghostPositions.length === 0 || !sceneRefs.meshObject) return;

    // Reuse the already-expanded/colorized geometry of the interactive model. Rebuilding it here
    // doubled vertex expansion and normal computation for every model or plate change.
    const displayGeometry = sceneRefs.meshObject.geometry;
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const instanced = new THREE.InstancedMesh(displayGeometry, material, ghostPositions.length);
    const matrix = new THREE.Matrix4();
    ghostPositions.forEach((p, i) => {
      matrix.makeTranslation(p.x, p.y, 0);
      instanced.setMatrixAt(i, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    sceneRefs.scene.add(instanced);
    sceneRefs.plateGhostMesh = instanced;
  }, [geometry, overhangFaces, plateArrangementPositions, allPlatesPositions, activePlateIndex, printer]);

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

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs) return;
    const dom = sceneRefs.renderer.domElement;
    dom.style.cursor = facePickModeActive ? "crosshair" : "default";
    if (!facePickModeActive || !onFacePicked) return;

    let downPos: { x: number; y: number } | null = null;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent): void => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    // A click that moved the pointer meaningfully is an orbit/pan drag, not a face pick.
    const handlePointerUp = (e: PointerEvent): void => {
      if (!downPos || Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) return;
      const mesh = sceneRefs.meshObject;
      if (!mesh) return;

      const rect = dom.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, sceneRefs.camera);
      const intersects = raycaster.intersectObject(mesh);
      const face = intersects[0]?.face;
      if (face) onFacePicked({ x: face.normal.x, y: face.normal.y, z: face.normal.z });
    };

    dom.addEventListener("pointerdown", handlePointerDown);
    dom.addEventListener("pointerup", handlePointerUp);
    return () => {
      dom.removeEventListener("pointerdown", handlePointerDown);
      dom.removeEventListener("pointerup", handlePointerUp);
    };
  }, [facePickModeActive, onFacePicked]);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs || facePickModeActive || !onSurfaceClicked) return;
    const dom = sceneRefs.renderer.domElement;

    const overhangByTriangle = new Map(overhangFaces.map((f) => [f.triangleIndex, f]));
    let downPos: { x: number; y: number } | null = null;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent): void => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    // A click that moved the pointer meaningfully is an orbit/pan drag, not an inspection click.
    const handlePointerUp = (e: PointerEvent): void => {
      if (!downPos || Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) return;
      const mesh = sceneRefs.meshObject;
      if (!mesh) return;

      const rect = dom.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, sceneRefs.camera);
      const hit = raycaster.intersectObject(mesh)[0];
      if (!hit || hit.faceIndex == null) return;

      const overhang = overhangByTriangle.get(hit.faceIndex);
      onSurfaceClicked({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        overhang: overhang ? { angleFromHorizontalDeg: overhang.angleFromHorizontalDeg, areaMm2: overhang.areaMm2 } : null,
      });
    };

    dom.addEventListener("pointerdown", handlePointerDown);
    dom.addEventListener("pointerup", handlePointerUp);
    return () => {
      dom.removeEventListener("pointerdown", handlePointerDown);
      dom.removeEventListener("pointerup", handlePointerUp);
    };
  }, [facePickModeActive, onSurfaceClicked, overhangFaces]);

  return <div ref={containerRef} className="h-full w-full" />;
});
