import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Создаём сцену
const scene = new THREE.Scene();

// Настройка камеры
const container = document.getElementById('container');
const containerWidth = container.clientWidth;
const containerHeight = container.clientHeight;
const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);

// Настройка рендерера
const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
renderer.setSize(containerWidth, containerHeight);
container.appendChild(renderer.domElement);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x87ceeb, 1); // Светло-голубой фон

// Добавление света
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Добавление плоскости (земли)
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
plane.receiveShadow = true;
scene.add(plane);

// Добавление сетки
const gridHelper = new THREE.GridHelper(500, 50, 0x000000, 0x000000);
gridHelper.position.y = -1;
scene.add(gridHelper);

// Настройка OrbitControls для управления камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Инициализация переменных
let font;
const cars = [];
let currentCarIndex = 0;
const labels = [];
const labelArrows = [];

// Пути к моделям автомобилей
const carModels = ['car1.glb', 'car2.glb', 'car3.glb'];

// Данные для выносок каждой модели
const labelData = {
	car1: [
		{ name: 'Колёса', position: new THREE.Vector3(1.2, -0.5, 2) },
		{ name: 'Двери', position: new THREE.Vector3(1.5, 0.5, 0) },
		{ name: 'Фары', position: new THREE.Vector3(0, 0.8, 2.5) },
		{ name: 'Капот', position: new THREE.Vector3(0, 1, 1.5) },
	],
	car2: [
		{ name: 'Колёса', position: new THREE.Vector3(1, -0.5, 2) },
		{ name: 'Двери', position: new THREE.Vector3(1.3, 0.5, 0) },
		{ name: 'Фары', position: new THREE.Vector3(0, 0.8, 2.2) },
		{ name: 'Капот', position: new THREE.Vector3(0, 1, 1.2) },
	],
	car3: [
		{ name: 'Колёса', position: new THREE.Vector3(1.1, -0.5, 2) },
		{ name: 'Двери', position: new THREE.Vector3(1.4, 0.5, 0) },
		{ name: 'Фары', position: new THREE.Vector3(0, 0.8, 2.3) },
		{ name: 'Капот', position: new THREE.Vector3(0, 1, 1.3) },
	],
};

// Загрузка шрифта
const fontLoader = new FontLoader();
fontLoader.load(
	'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
	function (loadedFont) {
		font = loadedFont;
		loadCarModels();
	}
);

// Загрузка моделей
const gltfLoader = new GLTFLoader();

function centerModel(model) {
	const box = new THREE.Box3().setFromObject(model);
	const center = box.getCenter(new THREE.Vector3());
	model.position.sub(center); // Центрируем модель
}

function loadCarModels() {
	let loadedModels = 0;

	carModels.forEach((modelPath, index) => {
		gltfLoader.load(
			`model/${modelPath}`,
			function (gltf) {
				const model = gltf.scene;
				centerModel(model);
				model.position.set(0, 0, 0);
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
					cars[currentCarIndex].visible = true;
					addLabelsToCar(cars[currentCarIndex], `car${currentCarIndex + 1}`);
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

function addLabelsToCar(car, carKey) {
	removeExistingLabels();

	const currentLabelData = labelData[carKey];

	currentLabelData.forEach((data) => {
		const label = createLabel(data.name);
		const labelPosition = data.position.clone().add(new THREE.Vector3(0, 2, 0));
		label.position.copy(labelPosition);
		scene.add(label);
		labels.push(label);

		// Создаём стрелку
		const carPartWorldPosition = car.localToWorld(data.position.clone());
		const direction = new THREE.Vector3()
			.subVectors(label.position, carPartWorldPosition)
			.normalize();
		const arrow = new THREE.ArrowHelper(
			direction,
			carPartWorldPosition,
			direction.length(),
			0x000000
		);
		scene.add(arrow);
		labelArrows.push(arrow);
	});
}

function removeExistingLabels() {
	labels.forEach((label) => {
		scene.remove(label);
	});
	labels.length = 0;

	labelArrows.forEach((arrow) => {
		scene.remove(arrow);
	});
	labelArrows.length = 0;
}

function createLabel(text) {
	const textGeometry = new TextGeometry(text, {
		font: font,
		size: 0.4,
		height: 0.05,
		curveSegments: 12,
		bevelEnabled: true,
		bevelThickness: 0.01,
		bevelSize: 0.02,
		bevelOffset: 0,
		bevelSegments: 5,
	});

	textGeometry.computeBoundingBox();
	const center = textGeometry.boundingBox.getCenter(new THREE.Vector3());
	textGeometry.translate(-center.x, -center.y, -center.z);

	const textMaterial = new THREE.MeshStandardMaterial({
		color: 0xffffff,
	});

	const textMesh = new THREE.Mesh(textGeometry, textMaterial);

	// Добавляем фон к тексту
	const backgroundMaterial = new THREE.MeshBasicMaterial({
		color: 0x000000,
		opacity: 0.5,
		transparent: true,
	});
	const backgroundGeometry = new THREE.PlaneGeometry(
		textGeometry.boundingBox.max.x * 1.2,
		textGeometry.boundingBox.max.y * 1.5
	);
	const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
	backgroundMesh.position.set(0, 0, -0.05); // Немного за текстом

	const labelGroup = new THREE.Group();
	labelGroup.add(backgroundMesh);
	labelGroup.add(textMesh);

	return labelGroup;
}

function switchCarModel() {
	cars[currentCarIndex].visible = false;
	currentCarIndex = (currentCarIndex + 1) % cars.length;
	cars[currentCarIndex].visible = true;
	addLabelsToCar(cars[currentCarIndex], `car${currentCarIndex + 1}`);
}

document.getElementById('switchCarButton').addEventListener('click', switchCarModel);

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
