var models = {}, allObjs = [], level = 0, levelHeight = 30,
playerID, player, selectedObject, grid, battleMat, lights = [];
var allowShadows = true;

function loadGame() {
	// load the environment
	loadEnvironment();
	
	//initMainPlayer();

	listenToModels();

	window.onunload = function() {
		fbRef.child( "Players/" + playerID ).remove();
	};

	window.onbeforeunload = function() {
		fbRef.child( "Players/" + playerID ).remove();
	};
}


function listenToModels() {
	// when a player is added, do something
	fbRef.child("Levels").on("child_added", newFloor => {
		const { key } = newFloor;

		fbRef.child( `Levels/${key}/Walls` ).on( "child_added", function( wall ) {
			buildWall(wall.val(), key);
		});
		fbRef.child( `Levels/${key}/Floor` ).on( "child_added", function( floor ) {
			buildFloor(floor.val(), key);
		});
	});

	fbRef.child( "Objects" ).on( "child_added", function( obj ) {
		var object = new Model(obj);
	});

	fbRef.child( "Objects" ).on("child_removed", function( snap ) {
		fbRef.child( "Players/" + snap.key ).off( "value", listenToModel );
		scene.remove( models[snap.key].mesh );
		delete models[snap.key];
	});


	fbRef.child("Land").on("value", function( snap ) {
		const vertices = snap.val();
		for (let i in vertices) battleMat.geometry.vertices[i].y = vertices[i];
	  	battleMat.geometry.verticesNeedUpdate = true;
	});
}


function loadEnvironment() {

	//lighting

	const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
	scene.add(ambientLight);

	for (var l = 0; l < 2; l++) {
		if (l == 1) l++;
		const light = new THREE.PointLight(0xFFFFFF, 2.6, 300);
		light.position.x = (l-1)*40;
		light.position.y = 180;
		light.position.z = 0;
		light.castShadow = true;
		light.shadow.mapSize.height = 2**11;
		light.shadow.mapSize.width = 2**11;
		scene.add(light);
		lights[l] = light;
	}

	//Battle MAt

	const transparent = new THREE.MeshBasicMaterial({transparent:true,opacity:0,wireframe:true});
	const plane = new THREE.BoxGeometry(540, 1, 400, 27, 1, 20);	
	const testMaterial = new THREE.MeshPhongMaterial({color: 0x666666, wireframe: false, side: THREE.DoubleSide});

	battleMat = new THREE.Mesh(plane, [testMaterial,testMaterial,testMaterial,transparent,testMaterial,testMaterial]);
//	battleMat.rotation.x = -Math.PI/2;

	//battleMat.rotation.set(-Math.PI/2,0,0);
	battleMat.geometry.dynamic = true; 
	battleMat.position.y = 0;
	battleMat.receiveShadow = true;
	scene.add(battleMat);


	var textureGrid = new THREE.TextureLoader().load("/public/img/grd.png");
	var materialGrid = new THREE.MeshPhongMaterial({map:textureGrid, color: 0xFFFFFF,opacity: 0.5});
	grid = new THREE.Mesh(plane, [transparent, transparent, materialGrid, transparent, transparent, transparent]);
	materialGrid.transparent = true;
//	objectGrid.rotation.x = -Math.PI/2;
	//grid.rotation.set(-Math.PI/2,0,0);
	grid.position.y = 0;
	grid.geometry.dynamic = true; 

	//grid = objectGrid;

	scene.add(grid);

	const backImg = new THREE.TextureLoader().load('/public/img/back.png')

	scene.background = backImg;  
	

	/*
	var sphere_geometry = new THREE.SphereGeometry( 1 );
	var sphere_material = new THREE.MeshNormalMaterial();
	var sphere = new THREE.Mesh( sphere_geometry, sphere_material );*/

	//scene.add( sphere );
}

var building = false, wallHeight = levelHeight-1;
var buildingMode = "walls";
var structure = { lastPoint: undefined, walls: [], floors: []};

function getClickCoords(evt) {
    evt.preventDefault();

    //var mousePosition;

    mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects([grid], true);

    if (intersects.length < 0) return;
    
    const { point } = intersects[0], { lastPoint } = structure;

    if (lastPoint === undefined) structure.lastPoint = point;
    else {
			const deltaX = point.x - lastPoint.x, deltaZ = point.z - lastPoint.z;

			if (buildingMode == "walls") {
				fbRef.child(`Levels/${level}/Walls`).push({
					position: {
						x: lastPoint.x + deltaX/2,
						z: lastPoint.z + deltaZ/2
					},
					rotation: {
						y: -Math.atan(deltaZ / deltaX )
					},
					size: {
						height: wallHeight,
						length: Math.sqrt(deltaX**2 + deltaZ**2)
					}
				});
				structure.lastPoint = point;

			} else if (buildingMode == "floor") {
				fbRef.child(`Levels/${level}/Floor`).push({
					position: {
						x: lastPoint.x + deltaX/2,
						z: lastPoint.z + deltaZ/2
					},
					size: {
						x: Math.abs(deltaX),
						z: Math.abs(deltaZ)
					}
				});
				structure.lastPoint = undefined
			}
			
    }
};

function buildWall(wall, keyLevel) {
	wall.size.width = 3;
	const wallMaterial = new THREE.MeshPhongMaterial({color: 0x666666, wireframe: false, side: THREE.DoubleSide});
	const wallGeometry = new THREE.BoxGeometry(wall.size.length+wall.size.width, wall.size.height, wall.size.width, 1, 1);

	const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

	wallMesh.position.copy({
		x: wall.position.x, y: wall.size.height/2+keyLevel*levelHeight, z: wall.position.z
	});

	wallMesh.level = keyLevel;
	wallMesh.visible = keyLevel == level;

	wallMesh.rotation.y = wall.rotation.y;
	wallMesh.receiveShadow = true;

	scene.add(wallMesh);

	structure.walls.push(wall);

	const baseGeometry = new THREE.BoxGeometry(wall.size.length+wall.size.width+2, 2, wall.size.width+2, 1, 1);
	const base = new THREE.Mesh(baseGeometry, wallMaterial);

	base.position.copy({
		x: wall.position.x, y: 1+keyLevel*levelHeight, z: wall.position.z
	});
	base.level = keyLevel;
	base.visible = keyLevel == level;
	base.rotation.y = wall.rotation.y;
	base.receiveShadow = true;
	scene.add(base);
}

function buildFloor(floor, keyLevel) {
	const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(floor.size.x, 1, floor.size.z, 1, 1), new THREE.MeshPhongMaterial({color: 0x666666, wireframe: false, side: THREE.DoubleSide}))

	floorMesh.position.copy(floor.position);
	floorMesh.position.y = keyLevel*levelHeight - 0.52;
	//floorMesh.rotation.x = Math.PI*3/2;
	floorMesh.level = keyLevel;
	floorMesh.visible = keyLevel == level;

	floorMesh.receiveShadow = true;

	scene.add(floorMesh);

	structure.floors.push(floor);
}

function setBuildingState() {
	building = !building;
	if (building)	{ 
		renderer.domElement.addEventListener( 'click', getClickCoords, false ); 
		renderer.domElement.addEventListener( 'contextmenu', ()=> structure.lastPoint = undefined, false);

	}
	else renderer.domElement.removeEventListener('click', getClickCoords);
	structure.lastPoint = undefined;
}

function resetScene() {
	fbRef.child("levels").set([0]);
	while (scene.children.length > 0) {
    scene.remove(scene.children[0]); 
	}
	allObjs = [];
	models = {};
	loadEnvironment();
	setLevel(level);
}

layersVisible = [true, true, true, true, true, true, true, true, true, true, true];

function toggleVisible() {
	layersVisible[level] = !layersVisible[level];
	setLevel(level); 
}

function setLevel(lvl) {
	if (lvl > 10 || lvl < 0 || lvl == undefined) return;


	
	level = lvl;

	//Adjust light to the lowest visible layer
	for (var i = 0; i < layersVisible.length; i++) {
		if (layersVisible[i]) { 
			lights.forEach((light, index) => lights[index].position.y = (i*levelHeight) + 180);
			break;
		}
	}
	grid.position.y = lvl*levelHeight;

	if (!layersVisible[level]) {
		document.querySelector("#layer-visible-control").classList.add("disabled");
		document.querySelector("#layer-visible-control i").classList.add("fa-eye-slash");
	}
	else {
		document.querySelector("#layer-visible-control").classList.remove("disabled");
		document.querySelector("#layer-visible-control i").classList.remove("fa-eye-slash");
	}

	scene.children.forEach((child)=> {
		child.visible = child.level != undefined ? layersVisible[child.level] : true;
	});

	if (lvl == 0) grid.geometry = battleMat.geometry;
	else grid.geometry = new THREE.BoxGeometry(540, 1, 400, 27, 1, 20);	
}