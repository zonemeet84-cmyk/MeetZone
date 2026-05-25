/**
 * Free AR face masks: MediaPipe landmarks → Kalidokit smoothing → Three.js 3D render.
 * Optional GLB from /public/masks/*.glb; procedural 3D fallback if load fails.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Head pose smoothing (Kalidokit-style, no SSR-breaking deps) */
function solveHeadPose(landmarks) {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const nose = landmarks[1];
  const chin = landmarks[152];
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  return {
    x: Math.atan2(dy, dx),
    y: (nose.y - chin.y) * 2.5,
    z: (nose.z - (leftEye.z + rightEye.z) / 2) * 3,
  };
}

const AR_WIDTH = 640;
const AR_HEIGHT = 480;

const MASK_GLB = {
  Glasses: "/masks/glasses.glb",
  Crown: "/masks/crown.glb",
  Dog: "/masks/dog-ears.glb",
};

function buildProceduralMask(type) {
  const group = new THREE.Group();
  const mat = (color, metal = false) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: metal ? 0.6 : 0.1,
      roughness: metal ? 0.3 : 0.65,
    });

  switch (type) {
    case "dog": {
      const earGeo = new THREE.ConeGeometry(0.12, 0.28, 8);
      const earMat = mat(0x8b5a2b);
      const left = new THREE.Mesh(earGeo, earMat);
      left.position.set(-0.22, 0.35, 0.05);
      left.rotation.z = 0.35;
      const right = left.clone();
      right.position.x = 0.22;
      right.rotation.z = -0.35;
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat(0x1a1a1a));
      nose.position.set(0, -0.08, 0.42);
      group.add(left, right, nose);
      break;
    }
    case "cat": {
      const earGeo = new THREE.ConeGeometry(0.1, 0.32, 6);
      const earMat = mat(0xf97316);
      const left = new THREE.Mesh(earGeo, earMat);
      left.position.set(-0.2, 0.38, 0.02);
      left.rotation.z = 0.2;
      const right = left.clone();
      right.position.x = 0.2;
      right.rotation.z = -0.2;
      group.add(left, right);
      break;
    }
    case "crown": {
      const base = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 24), mat(0xffd700, true));
      base.position.y = 0.42;
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), mat(0xffd700, true));
        const a = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(a) * 0.32, 0.52, Math.sin(a) * 0.08);
        group.add(spike);
      }
      group.add(base);
      break;
    }
    case "devil": {
      const hornGeo = new THREE.ConeGeometry(0.08, 0.25, 8);
      const hornMat = mat(0xdc2626);
      const left = new THREE.Mesh(hornGeo, hornMat);
      left.position.set(-0.18, 0.4, 0.05);
      left.rotation.z = 0.4;
      const right = left.clone();
      right.position.x = 0.18;
      right.rotation.z = -0.4;
      group.add(left, right);
      break;
    }
    case "glasses": {
      const frameMat = mat(0x111111);
      const lensGeo = new THREE.TorusGeometry(0.11, 0.018, 8, 24);
      const left = new THREE.Mesh(lensGeo, frameMat);
      left.position.set(-0.14, 0.05, 0.38);
      const right = left.clone();
      right.position.x = 0.14;
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), frameMat);
      bridge.position.set(0, 0.05, 0.38);
      group.add(left, right, bridge);
      break;
    }
    case "angel": {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.025, 8, 32),
        mat(0xffffff)
      );
      ring.position.y = 0.55;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      break;
    }
    case "ghost": {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
      );
      body.position.set(0.35, 0.15, 0.2);
      group.add(body);
      break;
    }
    case "anime": {
      const eyeGeo = new THREE.SphereGeometry(0.09, 12, 12);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x4338ca, emissiveIntensity: 0.4 });
      const left = new THREE.Mesh(eyeGeo, eyeMat);
      left.scale.set(1.2, 1.5, 0.4);
      left.position.set(-0.14, 0.06, 0.4);
      const right = left.clone();
      right.position.x = 0.14;
      group.add(left, right);
      break;
    }
    case "cloth": {
      const mask = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.22, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x334155, transparent: true, opacity: 0.85 })
      );
      mask.position.set(0, -0.12, 0.35);
      group.add(mask);
      break;
    }
    default:
      break;
  }
  return group;
}

const PROCEDURAL_MAP = {
  Dog: "dog",
  Cat: "cat",
  Crown: "crown",
  Devil: "devil",
  Glasses: "glasses",
  Angel: "angel",
  Ghost: "ghost",
  Anime: "anime",
  Cloth: "cloth",
};

export const AR_3D_MASK_IDS = new Set(Object.keys(PROCEDURAL_MAP));

export function is3dArMask(maskId) {
  return AR_3D_MASK_IDS.has(maskId);
}

export class FaceMaskArEngine {
  constructor() {
    this.video = null;
    this.maskId = "None";
    this.ready = false;
    this.landmarks = null;
    this.smooth = { head: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0, z: 0 } };
    this.loader = new GLTFLoader();
    this.maskGroup = null;
    this._raf = null;
    this._stream = null;
    this._outputCanvas = null;
  }

  init(videoEl, displayCanvas) {
    if (!videoEl || typeof window === "undefined") return false;
    this.video = videoEl;
    this._outputCanvas = displayCanvas || null;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(AR_WIDTH, AR_HEIGHT);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, AR_WIDTH / AR_HEIGHT, 0.1, 100);
    this.camera.position.set(0, 0, 2.2);

    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(0.5, 1, 1);
    this.scene.add(amb, dir);

    this.headAnchor = new THREE.Group();
    this.scene.add(this.headAnchor);

    this.videoTex = new THREE.VideoTexture(videoEl);
    this.videoTex.colorSpace = THREE.SRGBColorSpace;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.8),
      new THREE.MeshBasicMaterial({ map: this.videoTex, side: THREE.DoubleSide })
    );
    plane.position.z = -0.5;
    this.scene.add(plane);

    this.ready = true;
    this._loop();
    return true;
  }

  getCanvas() {
    return this.renderer?.domElement;
  }

  getStream(fps = 30) {
    if (!this.renderer?.domElement?.captureStream) return null;
    if (!this._stream) {
      this._stream = this.renderer.domElement.captureStream(fps);
    }
    return this._stream;
  }

  getVideoTrack() {
    const s = this.getStream();
    return s?.getVideoTracks?.()[0] || null;
  }

  async setMask(maskId) {
    this.maskId = maskId;
    if (this.maskGroup) {
      this.headAnchor.remove(this.maskGroup);
      this.maskGroup.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
          else c.material.dispose();
        }
      });
      this.maskGroup = null;
    }
    if (maskId === "None" || !this.ready) return;

    const procType = PROCEDURAL_MAP[maskId];
    const glbPath = MASK_GLB[maskId];

    if (glbPath) {
      try {
        const gltf = await new Promise((resolve, reject) => {
          this.loader.load(glbPath, resolve, undefined, reject);
        });
        this.maskGroup = gltf.scene;
        this.maskGroup.scale.set(0.35, 0.35, 0.35);
        this.headAnchor.add(this.maskGroup);
        return;
      } catch (e) {
        console.warn(`[AR] GLB ${glbPath} failed, using procedural`, e);
      }
    }

    if (procType) {
      this.maskGroup = buildProceduralMask(procType);
      this.headAnchor.add(this.maskGroup);
    }
  }

  updateLandmarks(landmarks) {
    if (!landmarks?.length) {
      this.landmarks = null;
      return;
    }
    this.landmarks = landmarks;
    const solved = solveHeadPose(landmarks);
    const blend = 0.35;
    this.smooth.head.x += (solved.x - this.smooth.head.x) * blend;
    this.smooth.head.y += (solved.y - this.smooth.head.y) * blend;
    this.smooth.head.z += (solved.z - this.smooth.head.z) * blend;
  }

  _applyHeadPose() {
    if (!this.landmarks || this.maskId === "None") {
      this.headAnchor.visible = false;
      return;
    }
    this.headAnchor.visible = true;
    const lm = this.landmarks;
    const leftEye = lm[33];
    const rightEye = lm[263];
    const nose = lm[1];
    const forehead = lm[10];

    const cx = (leftEye.x + rightEye.x) / 2;
    const cy = (leftEye.y + rightEye.y) / 2;
    const faceW = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);

    const px = (cx - 0.5) * 2.4;
    const py = -(cy - 0.5) * 1.8;
    const pz = 0.15;
    const scale = Math.max(0.5, Math.min(2.2, faceW * 8));

    this.headAnchor.position.set(px, py + 0.05, pz);
    this.headAnchor.rotation.set(
      this.smooth.head.y * 0.8,
      this.smooth.head.x * 0.8,
      this.smooth.head.z * 0.8
    );
    this.headAnchor.scale.setScalar(scale);

    if (this.maskGroup) {
      const topY = forehead.y - cy;
      this.maskGroup.position.y = topY * 1.2;
      this.maskGroup.position.z = (nose.z - 0.5) * 0.3 + 0.35;
    }
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    if (!this.ready || !this.video) return;
    if (this.video.readyState >= 2) {
      this.videoTex.needsUpdate = true;
    }
    if (this.maskId !== "None") {
      this._applyHeadPose();
      this.renderer.render(this.scene, this.camera);

      if (this._outputCanvas) {
        const ctx = this._outputCanvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, AR_WIDTH, AR_HEIGHT);
          ctx.drawImage(this.renderer.domElement, 0, 0, AR_WIDTH, AR_HEIGHT);
        }
      }
    }
  }

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.ready = false;
  }
}
