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
    float intensity;
};  
uniform float time;
uniform PointLight pointLights[NUM_POINT_LIGHTS];
uniform vec3 colorA; 
uniform vec3 colorB; 
uniform sampler2D tex;
varying vec3 vUv;     
varying vec3 vNormal;
varying vec3 modelViewPosition;
void main() {
    vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);
    for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
        vec3 lightDirection = normalize(pointLights[l].position - modelViewPosition.xyz);
        float diffuse = max(dot(lightDirection, (vNormal)), 0.0);
        addedLights.rgb += diffuse * pointLights[l].color
        * (1.0); //'light intensity' 


        vec3 R = reflect(-lightDirection, vNormal);
        vec3 V = normalize(-modelViewPosition.xyz);
        float specular = 0.0;
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, 100.0);
        addedLights.rgb += specular;
    }
    // vec3 color = mix(colorA, colorB, vUv.y);
    vec2 UV = (vUv.xy + 1.0) / 2.0;
    vec4 color = texture2D(tex, UV);
    vec4 c = color * addedLights + color * 0.1;
    // c.g *= cnoise(vec4(UV.x * 10.0, UV.y * 10.0, time, 0)) + 0.5;
    gl_FragColor = c;
}
`;

let renderer, camera, scene = null;
const container = document.getElementById('container');
let controls;
let startTime, time;
let mesh;
let rotSpeed = new THREE.Vector3(0.01, 0.01, 0.01);
let axesHelper;
let uniforms;
let pointLight = new THREE.PointLight(0xffffff)
let pointLight2 = new THREE.PointLight(0xffffff)
var tex = new THREE.Texture();

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

    addMesh();

    pointLight.position.set(0, 0, 2)
    scene.add(pointLight)
    // pointLight2.position.set(0, -2, -2)
    // scene.add(pointLight2)
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
// switch texture
function onKeyDown(event) {
    if (event.which == ' '.charCodeAt(0)) {
        var loader = new THREE.TextureLoader();
        loader.load('../img/moon.png', function (texture) {
        console.log("here");
        mesh.material.uniforms.tex.value = texture;
        mesh.material.needsUpdate = true;
    });

    }
};

window.addEventListener('resize', onWindowResize, false);
document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('keydown', onKeyDown, false);

function addMesh() {
    // let geometry = new THREE.BoxGeometry(1, 1, 1);
    // let geometry = new THREE.SphereGeometry(1, 50, 50);
    var loader = new THREE.TextureLoader();
    loader.load('../img/mars.png', function (texture) {
        console.log("here");
        mesh.material.uniforms.tex.value = texture;
        mesh.material.needsUpdate = true;
    });

    let geometry = new THREE.PlaneGeometry(2, 2);
    uniforms = {
        time: {
            type: 'f',
            value: 0
        },
        colorA: {
            type: 'vec3',
            value: new THREE.Color(0x74ebd5)
        },
        colorB: {
            type: 'vec3',
            value: new THREE.Color(0xACB6E5)
        },
        tex: {
            type: 't',
            value: tex
        },
    };
    uniforms = THREE.UniformsUtils.merge([
        uniforms,
        THREE.UniformsLib['lights']
    ])

    const shaderMaterialParams = {
        uniforms: uniforms,
        vertexShader: vertexShader2,
        fragmentShader: noiseShader + fragmentShader1,
        lights: true,
        side: THREE.DoubleSide,
        transparent: true
    };

    const customMaterial = new THREE.ShaderMaterial(shaderMaterialParams);

    mesh = new THREE.Mesh(geometry, customMaterial);
    scene.add(mesh);

}

function animate() {
    controls.update();
    requestAnimationFrame(animate);

    time = performance.now() / 1000;
    mesh.material.uniforms.time.value = time;
    // mesh.rotation.x += rotSpeed.x;
    // mesh.rotation.y += rotSpeed.y;
    // mesh.rotation.z += rotSpeed.z;
    renderer.render(scene, camera);
}