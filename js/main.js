var container, scene, camera, renderer, composer;
var dragControls, raycaster;
var light, matrix, mesh, persistance, lacunarity;
var count = 0;
var brush = 1, radius=1;

var isoSurface = 0.2;
var scale = 26.86, lacunarity = 2.463, persistance = 0.26, octaves = 3, presence = 0.63; 
//const seed = 0.030272115025389512;
let seed = Math.random();

const mouse = new THREE.Vector2();

let controls = {};
let player = {
  height: .5,
  turnSpeed: .05,
  speed: .1,
  jumpHeight: .2,
  gravity: .01,
  velocity: 0,
  
  playerJumps: false
};

init();
animate();

function init() {
	// Setup
	container = document.getElementById( 'container' );

	scene = new THREE.Scene();

	THREE.Cache.enabled = true;

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMapping;
	renderer.setClearColor(0x000000, 0);
	//renderer.shadowMap.type = THREE.BasicShadowMap;

	raycaster = new THREE.Raycaster()

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set(15, player.height, -20);
	camera.lookAt(new THREE.Vector3(0, player.height, 0));

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	//controls = new THREE.FirstPersonControls(camera, container);

	camera.position.z = 40;
	camera.position.y = 35;
	camera.position.y = -35;


	window.addEventListener( "resize", onWindowResize, false );

	container.appendChild( renderer.domElement );
	document.body.appendChild( container );
	loadGame();



	document.addEventListener('keydown', ({ keyCode }) => { controls[keyCode] = true });
	document.addEventListener('keyup', ({ keyCode }) => { controls[keyCode] = false });

}

function animate() {
	requestAnimationFrame( animate );
	//control();
 	//ixMovementUpdate();
	render();
}

function control() {
  // Controls:Engine 
  if(controls[87]){ // w
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
  }
  if(controls[16]) { // w
    player.speed =  0.3;
  } else {
  	player.speed = .1;
  }
  if(controls[83]){ // s
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
  }
  if(controls[65]){ // a
    camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
  }
  if(controls[68]){ // d
    camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
  }
  if(controls[37]){ // la
    camera.rotation.y -= player.turnSpeed;
  }
  if(controls[39]){ // ra
    camera.rotation.y += player.turnSpeed;
  }


  if(controls[38]){ // up a
  	//camera.rotation.x -= player.turnSpeed / 2;
    camera.rotation.x -= Math.sin(camera.rotation.y + Math.PI / 2) * player.turnSpeed;
    camera.rotation.z -= -Math.cos(camera.rotation.y + Math.PI / 2) * player.turnSpeed;
  }
  if(controls[40]){ // down a
    camera.rotation.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.turnSpeed;
    camera.rotation.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.turnSpeed;
  }

  if(controls[32]) { // space
    if(player.jumps) return false;
    player.jumps = true;
    player.velocity = -player.jumpHeight;
  }
}

function ixMovementUpdate() {


  player.velocity += player.gravity;
  camera.position.y -= player.velocity;
  
  if(camera.position.y < player.height) {
    camera.position.y = player.height;
    player.jumps = false;
  }
}


function render() {
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( scene.children );


	renderer.clear();
	renderer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
}



function loadGame() {

	loadEnvironment();
	
	createObject();

}
function loadEnvironment() {

	
	const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
	scene.add(ambientLight);

	light = new THREE.PointLight(0xFFFFFF, 2.6, 300);

	light.position.copy(new THREE.Vector3(100, 250, 100));
	light.castShadow = true;
	light.shadow.mapSize.height = 2**11;
	light.shadow.mapSize.width = 2**11;
	scene.add(light);

	editorOption("isoSurface",(val)=>{
		isoSurface = val;
		createObject();
	}, 0.1, 10, 0.1, isoSurface);

	editorOption("persistance",(val)=>{
		persistance = val;
		createObject();
	}, 0.01, 1, 0.01, persistance);

	editorOption("lacunarity",(val)=>{
		lacunarity = val;
		createObject();
	}, 1, 5, 0.001, lacunarity);

	editorOption("scale",(val)=>{
		scale = val;
		createObject();
	}, 1, 50, 1, scale);

	editorOption("presence",(val)=>{
		presence = val;
		createObject();
	}, 0, 3, 0.01, presence);
	editorOption("brush",(val)=>{
		brush = val;
	}, -1, 1, 2, brush);
	editorOption("radius",(val)=>{
		radius = val;
	}, 1, 10, 0.5, radius);
}

container.addEventListener("click", getClickCoords);

function getClickCoords(evt) {
    evt.preventDefault();

    //var mousePosition;

    mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects([mesh], true);

    if (intersects.length <= 0) return;
    
    const { point } = intersects[0];
    const pos = mesh.worldToLocal(point);

    const newMatrix = mesh.marchingCubesMatrix;

    const center = new THREE.Vector3(Math.floor((pos.x+.49)/2), Math.floor((pos.z+.49)/2), Math.floor((pos.y+.49)/2));
    //radius = 5;

    for (let x = 0; x < newMatrix.length; x++) {
		for (let y = 0; y < newMatrix[x].length; y++) {
    		for (let z = 0; z < newMatrix[x][y].length; z++) {
    			const dist = Math.sqrt((x - center.x)**2 + (y - center.y)**2 + (z - center.z)**2)
    			const add = isoSurface - dist + radius;

    			newMatrix[x][y][z] -= add > 0 ? add*brush : 0;
    		}
    	} 	
    }

    createObject(newMatrix);

    //console.log();
};

function toBinary(num) {
	const array = [];
	for (let i = num; i > 0; i = Math.floor(i/2)) array.pop(i%2);
	return array; 
}

function toDecimal(arr) {
	return arr.reduce((acc, val, i) => acc += val*(2**i))
}

function smallDot(pos) {
	const m = new THREE.MeshBasicMaterial({color:"green"});
	const g = new THREE.SphereGeometry(0.3,5,5);
  	const vertSphere = new THREE.Mesh(g, m);
	//vertSphere.material.opacity = 0.1;
	//vertSphere.material.transparent = true;
	vertSphere.position.copy(pos);
  	scene.add(vertSphere);
}


function MarchingCubes() {
	this.geometry = new THREE.Geometry();
	const scope = this;

	this.add = function (map, position) {
			//if (map.length !== 8) throw "Expected 8 vertices array";

		let vertices = map.map(val => val > isoSurface);
		let configuration = toDecimal(vertices);

		// 20 seg

		if (configuration == 0) {
			count++;
			return;

		}


		//const geometry = new THREE.Geometry();
		const base = scope.geometry.vertices.length;
		function inter(num1, num2) {
			// interpolate between -1 and 1

			const ratio = (isoSurface - num1)/(num2-num1);
			const result = 2*ratio - 1;

			if (Math.abs(ratio) > 1) return 0;
			return result;
		}
		const triangles = triTable[configuration];
		const verticesIndexes = [];
		// el 1 cada 12;

		// 2464548 vertices adding all vertices

		// 45680 only adding required vertices!

		[
			new THREE.Vector3(-1+position.x, 					  -1+position.y, 						 0+position.z+inter(map[0],map[1])), //0
			new THREE.Vector3( 0+position.x+inter(map[1],map[2]), -1+position.y,  						 1+position.z), //1
			new THREE.Vector3( 1+position.x, 					  -1+position.y,					     0+position.z-inter(map[2],map[3])), //2
			new THREE.Vector3( 0+position.x+inter(map[0],map[3]), -1+position.y, 						-1+position.z), //3

			new THREE.Vector3(-1+position.x, 					   1+position.y, 					     0+position.z+inter(map[4],map[5])), //4
			new THREE.Vector3( 0+position.x+inter(map[5],map[6]),  1+position.y, 					     1+position.z), //5
			new THREE.Vector3( 1+position.x, 					   1+position.y, 					     0+position.z-inter(map[6],map[7])), //6
			new THREE.Vector3( 0+position.x+inter(map[4],map[7]),  1+position.y, 					    -1+position.z), //7

			new THREE.Vector3(-1+position.x, 					   0+position.y+inter(map[0],map[4]),   -1+position.z), //8
			new THREE.Vector3(-1+position.x, 					   0+position.y+inter(map[1],map[5]),    1+position.z), //9
			new THREE.Vector3( 1+position.x, 					   0+position.y+inter(map[2],map[6]),    1+position.z), //10
			new THREE.Vector3( 1+position.x, 					   0+position.y+inter(map[3],map[7]),   -1+position.z)  //11
		].forEach((vert, i)=>{
			verticesIndexes.push(scope.geometry.vertices.length);
			if (triangles.includes(i)) scope.geometry.vertices.push(vert);
			
		});

		if (verticesIndexes.length != 12) throw "verticesIndexes should have 8 vertices!";


		for (let i = 0; i < triangles.length; i += 3) {
			if (triangles[i] === -1) break;
			scope.geometry.faces.push(
				new THREE.Face3(
					verticesIndexes[triangles[i]],
					verticesIndexes[triangles[i+1]],
					verticesIndexes[triangles[i+2]]
				),
			);

		}
		return scope;
	}

	return this;
}


function createNoiseMatrix(size) {
	noise.seed(seed);
	const matrix = [];
	for (let x = 0; x < size*2; x++) {
		matrix[x] = [];
		for (let z = 0; z < size*2; z++) {
			matrix[x][z] = [];


			for (let y = 0; y < size; y++) {

				let noiseVariation = 0;

				let frecuency = 1;
				let amplitude = 1;

				for (let i = 0; i < octaves; i++) {

					const sampleX = x / scale * frecuency;
					const sampleZ = z / scale * frecuency;
					const sampleY = y / scale * frecuency;

					//console.log( noise.perlin2(x, z));
					noiseVariation += noise.perlin2(sampleX, sampleZ) * amplitude;
					noiseVariation -= noise.perlin3(sampleX, sampleZ, sampleY)*amplitude * presence;

					frecuency *= lacunarity;
					amplitude *= persistance;
				}

				matrix[x][z][y] = y/scale - noiseVariation * Math.log10(y + 1)*0.8;

			}
		}
	}
	return matrix;
}


function createSphreMatrix(size) {
	const matrix = [];
	for (let x = 0; x < size; x++) {
		matrix[x] = [];
		for (let z = 0; z < size; z++) {
			matrix[x][z] = [];
			for (let y = 0; y < size; y++) {
				matrix[x][z][y] = Math.sqrt((x - size/2)**2 + (y - size/2)**2 + (z - size/2)**2);

			}
		}
	}
	return matrix;
}


function createObject(matrix) {
	const material = new THREE.MeshPhongMaterial({color: 0xff5454, wireframe: false, side: THREE.DoubleSide});
	const marchingCube = MarchingCubes();

	scene.remove(mesh);

	const size = 20;

	if (matrix == undefined) matrix = createNoiseMatrix(size);
	//matrix = createSphreMatrix(size);

	if (isoSurface < 0) isoSurface = 0.1;

	for (let x = 1; x < size*2; x++) {
		for (let y = 1; y < size; y++) {
			for (let z = 1; z < size*2; z++) {
				const map = [
								matrix[x-1][z-1][y-1],
								matrix[x-1][z][y-1],
								matrix[x][z][y-1],
								matrix[x][z-1][y-1],
								matrix[x-1][z-1][y],
								matrix[x-1][z][y],
								matrix[x][z][y],
								matrix[x][z-1][y]
							];

				marchingCube.add(map, new THREE.Vector3(x*2,y*2,z*2));
			}
		}
	}

	marchingCube.geometry.computeVertexNormals() //<-- this


	mesh = new THREE.Mesh(marchingCube.geometry, material);

	mesh.geometry.dynamic = true; 
	mesh.receiveShadow = true;
	scene.add(mesh);
	mesh.marchingCubesMatrix = matrix;

	mesh.position.y = -12;

	//mesh.size = new THREE.Vector3(2,2,2);

}


function editorOption(name, callback, min=-10, max=10,step=1,initValue=1) {
	const hud = document.querySelector("#hud");

	if (document.querySelector("#"+name)) throw `There is another slider named "${name}".`;

	hud.insertAdjacentHTML("beforeend",`<div class="sliderDiv"><label>${name}</label><label class="value">${initValue}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${initValue}" class="slider" id="${name}"></div>`);

	const slider = document.querySelector("#"+name);

	slider.addEventListener("input", function () {
		this.previousSibling.textContent = this.value;
		callback(Number(this.value), this);
	});

}


//file:///C:/Users/manue/Desktop/Archivos/Programacion/HTML/Marching%20Cubes/index.html