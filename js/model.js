

var Model = function(object) {
	const scope = this;
	const loader = new THREE.STLLoader();
	const key = object.key;
	const obj = object.val();

	fbBucket.child(obj.model+".stl").getDownloadURL().then(function(url) {
		
		loader.load(url, function (object) {
			var material = new THREE.MeshPhongMaterial({color: 0xCCCCCC, wireframe: false, side: THREE.FrontSide});
			scope.mesh = new THREE.Mesh(object, material);
			scene.add( scope.mesh );
			allObjs.push(scope.mesh);
			scope.mesh.castShadow = allowShadows;

			scope.mesh.model = obj.model;
			scope.mesh.level = obj.level;
			scope.mesh.visible = obj.level == level;

			models[key] = scope;

			scope.mesh.onDrag = function (e) {
				fbRef.child(`Objects/${key}/orientation`).set(scope.getOrientation());
			};

			scope.mesh.onDragend = function (e) {
				fbRef.child(`Objects/${key}/orientation`).set(scope.getOrientation());
				const orientation = scope.getOrientation();
				const newLevel = Math.trunc(orientation.position.y/levelHeight);
				if (newLevel != scope.mesh.level) fbRef.child(`Objects/${key}/level`).set(newLevel);
				updateEdit(selectedObject);

				if (moveAxis) axisAppear();
			};

			scope.mesh.handleScroll = function(e) {
				const step = Math.PI*1/16;
			  	if (e.deltaY < 0) {
			    	scope.mesh.rotation.z += step;
			  	}
			  	if (e.deltaY > 0) {
			    	scope.mesh.rotation.z -= step;
			  	}
			  	fbRef.child(`Objects/${key}/orientation`).set(scope.getOrientation());
			}

			scope.mesh.selected = () => {
				scope.mesh.material.color = {r: 1, g: 1, b: 1}; 
				updateEdit(scope.mesh);
			}
			scope.mesh.deselected = () => scope.mesh.material.color = {r: 0.8, g: 0.8, b: 0.8};

			const fileName = obj.model;

			fbBucket.child(`config/${fileName.split("/")[1]}.txt`).getDownloadURL().then(function(configUrl) {
				var rawFile = new XMLHttpRequest();

			    rawFile.open("GET", configUrl, false);
			    rawFile.onreadystatechange = function () {
					var text = rawFile.responseText;
					var values = text.split("\n");
					values.forEach((a, i) => {
						var key = a.split(":")[0].trim(), prop, val = a.split(":")[1].trim();
						if (key.includes(" ")) prop = key.split(" ")[1], key = key.split(" ")[0];
						
						if (prop != undefined) scope.mesh[key][prop] = !isNaN(val) ? Number(val) : val;
						else scope.mesh[key] = !isNaN(val) ? Number(val) : val;
					});
			    }
			    rawFile.send(null);
				
			}).catch(function(error) {
		  	if (error.code == 'storage/object-not-found') {
		    	console.log(`No aditional configuration found for ${fileName.split("/")[1]}.`)
		    }
		  });

			fbRef.child(`Objects/${key}`).on("value", listenToModel);
		});
	}).catch(function(error) {
	  // Handle any errors
	});



	this.setOrientation = function( orientation ) {
		if ( scope.mesh ) {
			scope.mesh.position.copy( orientation.position );
			scope.mesh.rotation.x = orientation.rotation.x;
			scope.mesh.rotation.y = orientation.rotation.y;
			scope.mesh.rotation.z = orientation.rotation.z;

			if (orientation.scale != undefined) scope.mesh.scale.copy( orientation.scale );
		}
	};

	this.getOrientation = function() {
		if ( scope.mesh ) {
			return {
				position:{
					x: scope.mesh.position.x,
					y: scope.mesh.position.y,
					z: scope.mesh.position.z
				},
				rotation:{
					x: scope.mesh.rotation.x,
					y: scope.mesh.rotation.y,
					z: scope.mesh.rotation.z
				},
				scale:{
					x: scope.mesh.scale.x,
					y: scope.mesh.scale.y,
					z: scope.mesh.scale.z
				}
			}
		}
	};

	return this;
};

function listenToModel(snap) {
	models[snap.key].setOrientation(snap.val().orientation);
	models[snap.key].mesh.level = snap.val().level;
}

function pushModel(model) {
	fbRef.child(`Objects`).push({
		orientation: {
			position: {x: 0, y:level*levelHeight, z:0},
			rotation: {x: Math.PI*3/2, y:0, z:0},
			scale: {x: 4.3, y: 4.3, z:4.3}
		},
		model: model,
		level: level
	});
}

