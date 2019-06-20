let vertexShader2 = `
uniform float time;
varying vec3 vUv; 
varying vec3 vNormal;
varying vec3 modelViewPosition;
void main() {
    vUv = position; 
    vNormal           = normalMatrix * normal;
    vec4 viewPos      = modelViewMatrix * vec4(position, 1.0);
    modelViewPosition = viewPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

// import customFragmentShader from './shaders/fragmentShader1.glsl';
let fragmentShader1 = `
struct PointLight {
    vec3 color;
    vec3 position;
    float distance; 
};  
uniform float time;
uniform PointLight pointLights[NUM_POINT_LIGHTS];
uniform vec3 colorA; 
uniform vec3 colorB; 
varying vec3 vUv;     
varying vec3 vNormal;
varying vec3 modelViewPosition;
void main() {
    vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);
    for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
        vec3 lightDirection = normalize(pointLights[l].position - modelViewPosition.xyz);
        addedLights.rgb += max(dot(lightDirection, vNormal), 0.0) * pointLights[l].color
           * 1.0; //'light intensity' 
           vec3 R = reflect(-lightDirection, vNormal);
        vec3 V = normalize(-modelViewPosition.xyz);
        float specular = 0.0;
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, 100.0);
        addedLights.rgb += specular;
    }
    vec3 color = mix(colorA, colorB, vUv.z);
    vec3 c = color * addedLights.rgb + color * 0.1;
    gl_FragColor = vec4(c, 0.99);
}
`;

let renderer, camera, scene = null;
const container = document.getElementById('container');
let controls;
let startTime, time;
let cube;
let rotSpeed = new THREE.Vector3(0.01, 0.01, 0.01);
let axesHelper;
let uniforms;
let customPointLight;
let pointLight = new THREE.PointLight(0xffffff)
function initialize() {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({
    antialias: true, // to get smoother output
    alpha: true
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // create a camera in the scene
  // camera = new THREE.PerspectiveCamera(
  //   35,
  //   window.innerWidth / window.innerHeight,
  //   1,
  //   10000
  // );
  camera = new THREE.OrthographicCamera(window.innerWidth / -400, window.innerWidth / 400, window.innerHeight / 400, window.innerHeight / -400, 0, 1000);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.autoRotate = true;
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.03;
  controls.dispose();
  controls.update();

  //   axesHelper = new THREE.AxesHelper(5);
  //   scene.add(axesHelper);

  addCube();
  
  pointLight.position.set(0, 3, 5)
  scene.add(pointLight)

  scene.add(camera);
  camera.position.z = 10;


  // and then just look at it!
  camera.lookAt(scene.position);


  animate();
}

initialize();

function onWindowResize() {
  // notify the renderer of the size change
  renderer.setSize(window.innerWidth, window.innerHeight);
  // update the camera
  camera.left = -window.innerWidth / 400;
  camera.right = window.innerWidth / 400;
  camera.top = window.innerHeight / 400;
  camera.bottom = -window.innerHeight / 400;
  camera.updateProjectionMatrix();
  controls.handleMouseMoveRotate(window.innerWidth / 2, window.innerHeight / 2);
};

function onMouseMove(event) {
  controls.handleMouseMoveRotate(event.clientX, event.clientY);
};

window.addEventListener('resize', onWindowResize, false);
document.addEventListener('mousemove', onMouseMove, false);

function addCube() {
  // let geometry = new THREE.SphereGeometry(1, 32, 32);
  let geometry = new THREE.BoxGeometry(1, 1, 1);
  uniforms = {
    time: {
      type: 'f',
      value: 0
    },
    colorA: {
      type: 'vec3',
      value: new THREE.Color(0xff89d9)
    },
    colorB: {
      type: 'vec3',
      value: new THREE.Color(0x74ebd5)
    }
  };
  uniforms = THREE.UniformsUtils.merge([
    uniforms,
    THREE.UniformsLib['lights']
  ])

  const shaderMaterialParams = {
    uniforms: uniforms,
    vertexShader: vertexShader2,
    fragmentShader: fragmentShader1,
    lights: true,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: true,
  };

  const customMaterial = new THREE.ShaderMaterial(shaderMaterialParams);

  cube = new THREE.Mesh(geometry, customMaterial);
  scene.add(cube);
}

function animate() {
  controls.update();
  requestAnimationFrame(animate);

  time = performance.now() / 1000;
  cube.material.uniforms.time.value = time;
  
  // cube.lookAt(camera.position);
  // cube.rotation.x += rotSpeed.x;
  // cube.rotation.y += rotSpeed.y;

  renderer.render(scene, camera);
}