import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { KuchenKonfig } from '../modell/typen';
import { buildCake, disposeCake, type CakeBuild } from './cakeBuilder';

/**
 * The 3D stage: renderer, studio lighting, camera and the current cake.
 * Renders on demand only (when something changed or the camera moves).
 */
export class Stage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 1, 600);
  private readonly controls: OrbitControls;
  private readonly keyLight: THREE.DirectionalLight;
  private readonly ground: THREE.Mesh;
  private cake: CakeBuild | null = null;
  private config: KuchenKonfig | null = null;
  private dirty = true;
  private rebuildQueued = false;
  private framed = false;
  private frameKey = '';

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';

    const background = new THREE.Color('#efe9e2');
    this.scene.background = background;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    this.scene.environmentIntensity = 0.62;
    pmrem.dispose();

    this.keyLight = new THREE.DirectionalLight('#fff4e6', 2.3);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.06;
    this.keyLight.shadow.radius = 6;
    this.scene.add(this.keyLight, this.keyLight.target);

    const fill = new THREE.DirectionalLight('#dfe9ff', 0.45);
    fill.position.set(50, 25, 35);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight('#ffffff', 0.5);
    rim.position.set(10, 35, -60);
    this.scene.add(rim);

    // table: matches the background, only shows the cake's shadow
    this.ground = new THREE.Mesh(
      new THREE.CircleGeometry(400, 64).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: background, roughness: 0.95, metalness: 0 }),
    );
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    this.scene.fog = new THREE.Fog(background, 220, 420);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.addEventListener('change', () => (this.dirty = true));

    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  /** Shows the given configuration (rebuild is coalesced to once per frame). */
  show(config: KuchenKonfig): void {
    this.config = config;
    this.rebuildQueued = true;
  }

  /** Moves the camera back to the default three-quarter view. */
  resetView(): void {
    this.framed = false;
    this.frameKey = '';
    this.rebuildQueued = true;
  }

  /** PNG of the current view. */
  snapshot(): string {
    this.render();
    return this.renderer.domElement.toDataURL('image/png');
  }

  private rebuild(): void {
    if (!this.config) return;
    if (this.cake) {
      this.scene.remove(this.cake.group);
      disposeCake(this.cake.group);
    }
    this.cake = buildCake(this.config, () => (this.rebuildQueued = true));
    this.scene.add(this.cake.group);
    this.frame(this.cake);
    this.dirty = true;
  }

  /** Fits lights and (when the overall size changed) the camera to the cake. */
  private frame(cake: CakeBuild): void {
    const reach = Math.max(cake.radius * 1.25, cake.height * 0.75);
    const target = new THREE.Vector3(0, cake.height * 0.42, 0);

    // key light from the upper left front: shadows fall to the right and stay visible
    this.keyLight.position.set(-reach * 1.9, cake.height + reach * 1.7, reach * 1.25);
    this.keyLight.target.position.copy(target);
    const cam = this.keyLight.shadow.camera;
    const extent = Math.max(cake.radius * 1.9, cake.height * 1.2);
    cam.left = -extent;
    cam.right = extent;
    cam.top = extent;
    cam.bottom = -extent;
    cam.near = 1;
    cam.far = (cake.height + reach * 2.4) * 3;
    cam.updateProjectionMatrix();

    // only re-frame the camera when the cake's overall size class changes, so that
    // adjusting a slider does not fight the user's own view
    const key = `${Math.round(cake.radius / 3)}:${Math.round(cake.height / 4)}`;
    if (this.framed && key === this.frameKey) return;
    this.frameKey = key;

    const aspect = this.camera.aspect;
    const fov = (this.camera.fov * Math.PI) / 180;
    const fitHeight = (cake.height * 0.62 + cake.radius * 0.55) / Math.tan(fov / 2);
    const fitWidth = (cake.radius * 1.12) / (Math.tan(fov / 2) * aspect);
    const distance = Math.max(fitHeight, fitWidth) * 1.12;
    const azimuth = this.framed ? this.controls.getAzimuthalAngle() : 0.42;
    const polar = this.framed ? this.controls.getPolarAngle() : 1.05;
    this.controls.target.copy(target);
    this.camera.position.set(
      target.x + distance * Math.sin(polar) * Math.sin(azimuth),
      target.y + distance * Math.cos(polar),
      target.z + distance * Math.sin(polar) * Math.cos(azimuth),
    );
    this.controls.minDistance = distance * 0.45;
    this.controls.maxDistance = distance * 1.9;
    this.controls.update();
    this.framed = true;
  }

  private resize(): void {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // a different aspect ratio needs a different camera distance
    if (this.framed) {
      this.frameKey = '';
      if (this.cake) this.frame(this.cake);
    }
    this.dirty = true;
  }

  private tick(): void {
    if (this.rebuildQueued) {
      this.rebuildQueued = false;
      this.rebuild();
    }
    this.controls.update();
    if (this.dirty) this.render();
  }

  private render(): void {
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
  }
}
