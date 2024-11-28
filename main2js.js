import * as THREE from './libs/three/three.module.js';
import { FontLoader } from './jsm/loaders/FontLoader.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { TextGeometry } from './jsm/geometries/TextGeometry.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

// Создаём сцену
const scene = new THREE.Scene();

// Настройка камеры
const container = document.getElementById('container');
const containerWidth = container.clientWidth;
const containerHeight = container.clientHeight;
const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);
camera.lookAt(scene.position);

// Настройка рендерера
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(containerWidth, containerHeight);
container.appendChild(renderer.domElement);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xa0a0a0, 1); // Светло-серый фон
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Добавление света
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Добавление плоскости (земли)
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// Добавление сетки
const gridHelper = new THREE.GridHelper(500, 50, 0x000000, 0x000000);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// Настройка OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Инициализация переменных
let font;
const cars = [];
let currentCarIndex = 0;
const labels = [];

// Пути к моделям автомобилей
const carModels = ['car.glb']; // Используем одну модель

// Загрузка шрифта
const fontLoader = new FontLoader();
fontLoader.load('./fonts/helvetiker_bold.typeface.json', function (loadedFont) {
	font = loadedFont;
	loadCarModels();
});

function createTextOverCar(text, position) {
	const textGeometry = new TextGeometry(text, {
		font: font,
		size: 0.8,
		height: 0.2,
		curveSegments: 12,
		bevelEnabled: true,
		bevelThickness: 0.03,
		bevelSize: 0.02,
		bevelSegments: 5,
	});

	textGeometry.computeBoundingBox();
	const center = textGeometry.boundingBox.getCenter(new THREE.Vector3());
	textGeometry.translate(-center.x, -center.y, -center.z);

	const textMaterial = new THREE.MeshStandardMaterial({
		color: 0xffd700, // Золотой цвет
	});

	const textMesh = new THREE.Mesh(textGeometry, textMaterial);
	textMesh.position.copy(position);
	scene.add(textMesh);

	return textMesh;
}

function placeTextAboveCar(car, text) {
	const box = new THREE.Box3().setFromObject(car);
	const size = box.getSize(new THREE.Vector3());
	const position = box.getCenter(new THREE.Vector3());
	position.y += size.y + 1.5;

	const label = createTextOverCar(text, position);
	labels.push(label);
}

// Загрузка моделей автомобилей
const gltfLoader = new GLTFLoader();

function centerModel(model) {
	const box = new THREE.Box3().setFromObject(model);
	const center = box.getCenter(new THREE.Vector3());
	const size = box.getSize(new THREE.Vector3());

	model.position.sub(center);

	const yOffset = size.y / 2 - 0.7;
	model.position.y = yOffset;
}

function loadCarModels() {
	let loadedModels = 0;

	carModels.forEach((modelPath, index) => {
		gltfLoader.load(
			`model/${modelPath}`,
			function (gltf) {
				const model = gltf.scene;
				centerModel(model);
				model.traverse(function (child) {
					if (child.isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;
					}
				});
				model.visible = false;
				scene.add(model);
				cars[index] = model;
				loadedModels++;

				if (loadedModels === carModels.length) {
					animateScene();
				}
			},
			undefined,
			function (error) {
				console.error(`Ошибка загрузки модели ${modelPath}:`, error);
			}
		);
	});
}

function applyColorToCar(car, index) {
	const colors = [0xff0000, 0x00ff00, 0x0000ff]; // Красный, зеленый, синий
	const color = colors[index % colors.length];

	car.traverse(function (child) {
		if (child.isMesh) {
			child.material = child.material.clone();
			child.material.color.setHex(color);
		}
	});
}

function showCar() {
	document.getElementById('showCarButton').style.display = 'none';

	cars[0].visible = true;
	currentCarIndex = 0;

	placeTextAboveCar(cars[0], 'Car1');

	document.getElementById('createArrayButton').style.display = 'inline-block';
}

function createStructureArray() {
	cars[currentCarIndex].visible = false;
	labels.forEach((label) => scene.remove(label));
	labels.length = 0;

	for (let i = 0; i < 3; i++) {
		const carClone = cars[0].clone();
		scene.add(carClone);
		cars.push(carClone);

		carClone.visible = true;
		carClone.position.x = (i - 1) * 5; // Размещаем машины по горизонтали

		applyColorToCar(carClone, i);

		// Добавляем лейбл над каждой машиной
		placeTextAboveCar(carClone, `Car${i + 1}`);
	}
	document.getElementById('createArrayButton').style.display = 'none';

	document.getElementById('restartButton').style.display = 'inline-block';
	document.getElementById('restartButton').onclick = function () {
		location.reload();
	};
	updateCodeBlock();
}

function updateCodeBlock() {
	const codeBlock = document.getElementById('codeBlock');
	const code = `
<span class="keyword">#include</span> &lt;iostream&gt;
<span class="keyword">using</span> <span class="keyword">namespace</span> std;

<span class="keyword">struct</span> <span class="type">Car</span> {
    <span class="type">string</span> <span class="variable">model</span>;
    <span class="type">string</span> <span class="variable">color</span>;
};

<span class="keyword">int</span> <span class="function">main</span>() {
    <span class="type">Car</span> <span class="variable">car1</span> = {<span class="string">"Car 1"</span>, <span class="string">"Red"</span>};
    <span class="type">Car</span> <span class="variable">car2</span> = {<span class="string">"Car 2"</span>, <span class="string">"Green"</span>};
    <span class="type">Car</span> <span class="variable">car3</span> = {<span class="string">"Car 3"</span>, <span class="string">"Blue"</span>};

    <span class="variable">cout</span> &lt;&lt; <span class="string">"Model: "</span> &lt;&lt; <span class="variable">car1.model</span> &lt;&lt; <span class="string">", Color: "</span> &lt;&lt; <span class="variable">car1.color</span> &lt;&lt; <span class="string">"\\n"</span>;
    <span class="variable">cout</span> &lt;&lt; <span class="string">"Model: "</span> &lt;&lt; <span class="variable">car2.model</span> &lt;&lt; <span class="string">", Color: "</span> &lt;&lt; <span class="variable">car2.color</span> &lt;&lt; <span class="string">"\\n"</span>;
    <span class="variable">cout</span> &lt;&lt; <span class="string">"Model: "</span> &lt;&lt; <span class="variable">car3.model</span> &lt;&lt; <span class="string">", Color: "</span> &lt;&lt; <span class="variable">car3.color</span> &lt;&lt; <span class="string">"\\n"</span>;

    <span class="keyword">return</span> <span class="value">0</span>;
}
    `;
	codeBlock.innerHTML = code;
}

document.getElementById('showCarButton').addEventListener('click', showCar);
document.getElementById('createArrayButton').addEventListener('click', createStructureArray);

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;

	camera.aspect = containerWidth / containerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(containerWidth, containerHeight);
}

function animateScene() {
	requestAnimationFrame(animateScene);
	controls.update();
	renderer.render(scene, camera);
}
