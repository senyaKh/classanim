import * as THREE from './libs/three/three.module.js';
import { FontLoader } from './jsm/loaders/FontLoader.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { TextGeometry } from './jsm/geometries/TextGeometry.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

// Создаем сцену
const scene = new THREE.Scene();

// Настройка камеры
const container = document.getElementById('container');
const containerWidth = container.clientWidth;
const containerHeight = container.clientHeight;
const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
camera.position.set(0, 5, 30);

// Настройка рендерера
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(containerWidth, containerHeight);
container.appendChild(renderer.domElement);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xd3d3d3, 1); // Светло-серый фон
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Добавление света
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Загрузка текстуры земли
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('textures/ground_texture.jpg');
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(100, 100);

// Добавление плоскости (земли)
const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
const planeMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0; // Опущено на уровень пола
plane.receiveShadow = true;
scene.add(plane);

// Добавление сетки
const gridHelper = new THREE.GridHelper(2000, 500, 0x808080, 0x808080); // Светло-серая сетка
gridHelper.position.y = 0.01; // Немного выше плоскости, чтобы было видно
scene.add(gridHelper);

// Настройка OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.minDistance = 10;
controls.maxDistance = 100;

// Инициализация переменных
let font;
const cars = [];
const labels = [];
const labelArrows = [];
const attachmentPoints = [];
const carNameLabels = [];

// Пути к моделям автомобилей
const carModels = ['car1.glb', 'car2.glb', 'car3.glb'];

// Данные выносок для каждой модели
const labelData = {
	car1: [
		{
			name: 'Hood = Metal',
			position: new THREE.Vector3(0, 1.4, -0.49),
			labelPosition: new THREE.Vector3(-0.17, 2.97, 0.19),
		},
		{
			name: 'Doors = 4',
			position: new THREE.Vector3(0.85, 0.85, -0.12),
			labelPosition: new THREE.Vector3(2.2, 2.1, -1.3),
		},
		{
			name: 'Headlights = 2',
			position: new THREE.Vector3(-0.63, 0.64, 2.16),
			labelPosition: new THREE.Vector3(-4, 1, 2.5),
		},
		{
			name: 'Wheels = 4',
			position: new THREE.Vector3(0.8, 0.3, 1.5),
			labelPosition: new THREE.Vector3(3.5, 1.5, 1.03),
		},
		{
			 	name: 'Color = Red',
			 	position: new THREE.Vector3(0, 1, 1),
			 	labelPosition: new THREE.Vector3(-5, 5, 1),
		},
	],
	car2: [
		{
			name: 'Hood = Metal',
			position: new THREE.Vector3(0.0, 1.4, -1.52),
			labelPosition: new THREE.Vector3(-0.17, 2.97, 0.19),
		},
		{
			name: 'Doors = 4',
			position: new THREE.Vector3(0.85, 0.85, -0.12),
			labelPosition: new THREE.Vector3(2.12, 2.1, 0.0),
		},
		{
			name: 'Headlights = 2',
			position: new THREE.Vector3(-0.63, 0.64, 2.16),
			labelPosition: new THREE.Vector3(-4, 1, 2.5),
		},
		{
			name: 'Wheels = 4',
			position: new THREE.Vector3(0.8, 0.3, 1.5),
			labelPosition: new THREE.Vector3(3.54, 1, 2.02),
		},
		{
			name: 'Color = Green',
			position: new THREE.Vector3(0, 1, 1),
			 	labelPosition: new THREE.Vector3(-5, 5, 1),
   },
	],
	car3: [
		{
			name: 'Hood = Metal',
			position: new THREE.Vector3(0.0, 1.4, -0.31),
			labelPosition: new THREE.Vector3(-0.17, 2.97, 0.19),

		},
		{
			name: 'Doors = 4',
			position: new THREE.Vector3(0.85, 0.85, -0.12),
			labelPosition: new THREE.Vector3(1.4, 2.1, 0.0),
		},
		{
			name: 'Headlights = 2',
			position: new THREE.Vector3(-0.63, 0.64, 2.16),
			labelPosition: new THREE.Vector3(-4, 2.5, 2.5),
		},
		{
			name: 'Wheels = 4',
			position: new THREE.Vector3(-0.63, 0.64, 2.16),
			labelPosition: new THREE.Vector3(3, 1, 2.0),
		},
		{
			name: 'Color = Blue',
			position: new THREE.Vector3(0, 1, 1),
			labelPosition: new THREE.Vector3(-5, 5, 1),
   },
	],
};

// Загрузка шрифта
const fontLoader = new FontLoader();
fontLoader.load('./fonts/helvetiker_bold.typeface.json', function (loadedFont) {
	font = loadedFont;
});

// Загрузка моделей автомобилей
const gltfLoader = new GLTFLoader();

function centerModel(model) {
	const box = new THREE.Box3().setFromObject(model);
	const center = box.getCenter(new THREE.Vector3());
	const size = box.getSize(new THREE.Vector3());

	model.position.sub(center); // Центрируем модель

	// Опускаем модель на плоскость
	const yOffset = size.y / 2 - 0.7;
	model.position.y = yOffset;
	
}

function loadSingleCar() {
	gltfLoader.load(
		'model/' + carModels[0],
		function (gltf) {
			const model = gltf.scene;
			centerModel(model);
			model.traverse(function (child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					child.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
				}
			});
			model.visible = true;
			cars.push(model);
			scene.add(model);
			addLabelsToCar(model, 'car1');
			addCarNameLabel(model, 'car1');
			renderScene();
		},
		undefined,
		function (error) {
			console.error('Ошибка загрузки модели:', error);
		}
	);
}

function loadCarArray() {
	let loadedModels = 0;
	const positions = [-8, 0, 8]; // Положение по оси X для машин
	carModels.forEach((modelPath, index) => {
		gltfLoader.load(
			'model/' + modelPath,
			function (gltf) {
				const model = gltf.scene;
				centerModel(model);
				model.traverse(function (child) {
					if (child.isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;
						// Установка цвета материала
						let color;
						if (index === 0) color = 0xff0000; // Красный
						else if (index === 1) color = 0x00ff00; // Зеленый
						else if (index === 2) color = 0x0000ff; // Синий
						child.material = new THREE.MeshStandardMaterial({ color: color });
					}
				});
				model.visible = true;
				model.position.x = positions[index];
					// Adjust Z position to ensure proper layering
					if (index === 2) { // car3
						model.position.z = -10; // Move car3 slightly forward
					}
					else if (index === 0){
						model.position.z = -10; // Move car3 slightly forward
					}
					 else {
						model.position.z = 0; // Keep car1 and car2 at the base position
					}
				cars.push(model);
				scene.add(model);
				addLabelsToCar(model, 'car' + (index + 1));
				addCarNameLabel(model, 'car' + (index + 1));
				loadedModels++;
				if (loadedModels === carModels.length) {
					renderScene();
				}
			},
			undefined,
			function (error) {
				console.error('Ошибка загрузки модели:', error);
			}
		);
	});
}

function addLabelsToCar(car, carKey) {
	const currentLabelData = labelData[carKey];

	currentLabelData.forEach((data) => {
		const label = createLabel(data.name);
		const labelPosition = data.labelPosition.clone(); // Используем сохраненную позицию выноски
		label.position.copy(labelPosition);
		car.add(label); // Добавляем лейбл в модель машины
		labels.push(label);

		// Создание точки привязки на машине
		const attachmentPoint = new THREE.Mesh(
			new THREE.SphereGeometry(0.1, 8, 8),
			new THREE.MeshBasicMaterial({ color: 0xff0000 })
		);
		const attachmentPosition = data.position.clone();
		attachmentPoint.position.copy(attachmentPosition);
		car.add(attachmentPoint);
		attachmentPoints.push(attachmentPoint); // Добавляем в массив для последующего удаления

		// Создание линии между выноской и точкой привязки
		const points = [];
		points.push(new THREE.Vector3(0, 0, 0)); // Локальная позиция точки привязки
		points.push(
			new THREE.Vector3(
				data.labelPosition.x - data.position.x,
				data.labelPosition.y - data.position.y,
				data.labelPosition.z - data.position.z
			)
		); // Локальная позиция выноски относительно точки привязки

		const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
		const line = new THREE.Line(lineGeometry, lineMaterial);
		attachmentPoint.add(line); // Добавляем линию как дочерний объект точки привязки
		labelArrows.push(line);
	});
}

function addCarNameLabel(car, carKey) {
	const carNames = {
		car1: 'Car 1',
		car2: 'Car 2',
		car3: 'Car 3',
	};

	const carName = carNames[carKey];

	const nameLabel = createCarNameLabel(carName);

	const box = new THREE.Box3().setFromObject(car);
	const size = box.getSize(new THREE.Vector3());
	nameLabel.position.set(0, size.y + 1, 0);

	car.add(nameLabel);
	carNameLabels.push(nameLabel);
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
		(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) * 1.2,
		(textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y) * 1.5
	);
	const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
	backgroundMesh.position.set(0, 0, -0.05); // Немного позади текста

	const labelGroup = new THREE.Group();
	labelGroup.add(backgroundMesh);
	labelGroup.add(textMesh);

	return labelGroup;
}

function createCarNameLabel(text) {
	const textGeometry = new TextGeometry(text, {
		font: font,
		size: 1.0,
		height: 0.1,
		curveSegments: 12,
		bevelEnabled: true,
		bevelThickness: 0.02,
		bevelSize: 0.05,
		bevelOffset: 0,
		bevelSegments: 5,
	});

	textGeometry.computeBoundingBox();
	const center = textGeometry.boundingBox.getCenter(new THREE.Vector3());
	textGeometry.translate(-center.x, -center.y, -center.z);

	const textMaterial = new THREE.MeshStandardMaterial({
		color: 0xffff00,
		emissive: 0x444400,
	});

	const textMesh = new THREE.Mesh(textGeometry, textMaterial);

	return textMesh;
}

// Обработчики кнопок
document.getElementById('showCarButton').addEventListener('click', function () {
	loadSingleCar();
	document.getElementById('showCarButton').style.display = 'none';
	document.getElementById('createArrayButton').style.display = 'inline-block';
});

document.getElementById('createArrayButton').addEventListener('click', function () {
	// Удаляем предыдущую машину
	cars.forEach((car) => {
		scene.remove(car);
	});
	cars.length = 0;
	// Удаляем лейблы и точки привязки
	labels.length = 0;
	labelArrows.length = 0;
	attachmentPoints.length = 0;
	carNameLabels.length = 0;

	loadCarArray();
	document.getElementById('createArrayButton').style.display = 'none';
	document.getElementById('resetSceneButton').style.display = 'inline-block';
});

document.getElementById('resetSceneButton').addEventListener('click', function () {
	// Удаляем все машины
	cars.forEach((car) => {
		scene.remove(car);
	});
	cars.length = 0;
	// Удаляем лейблы и точки привязки
	labels.length = 0;
	labelArrows.length = 0;
	attachmentPoints.length = 0;
	carNameLabels.length = 0;

	document.getElementById('resetSceneButton').style.display = 'none';
	document.getElementById('showCarButton').style.display = 'inline-block';
	renderScene();
});

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;

	camera.aspect = containerWidth / containerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(containerWidth, containerHeight);
}

function renderScene() {
	requestAnimationFrame(renderScene);
	controls.update();
	renderer.render(scene, camera);
}

// Начинаем рендер сцены
renderScene();
