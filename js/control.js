function updateEdit(obj) {
	const htmlValue = 
		"<div class='container'>"+
			"<h4 class='card-title text-capitalize'>"+obj.model.split("/")[1]+"</h4>" +
			"<hr class='my-1'>"+
			"<h6>Rotation</h6>"+
			"<div class='row mx-0'>" +
			  "<div class='col-2 mx-0 '>" +
			    "<span class='badge badge-pill badge-primary'>X</span>" +
			  "</div>" +
			  "<div class='col-10 mx-0 '>" +
			    "<input type='range' class='custom-range' id='rotX' min="+ Math.PI*3/2 +" step="+Math.PI*1/16+" max="+ Math.PI*5/2 +" value="+selectedObject.rotation.x+">"+
			  "</div>" +
			"</div>" +
			"<div class='row mx-0'>" +
			  "<div class='col-2 mx-0 '>" +
			    "<span class='badge badge-pill badge-primary'>Y</span>" +
			  "</div>" +
			  "<div class='col-10 mx-0 '>" +
			    "<input type='range' class='custom-range' id='rotY' min='0' step="+Math.PI*1/16+" max="+ 2*Math.PI+" value="+selectedObject.rotation.y+">"+
			  "</div>" +
			"</div>" +
			"<div class='row mx-0'>" +
			  "<div class='col-2 mx-0 '>" +
			    "<span class='badge badge-pill badge-primary'>Z</span>" +
			  "</div>" +
			  "<div class='col-10 mx-0 '>" +
			    "<input type='range' class='custom-range' id='rotZ' min='0' step="+Math.PI*1/16+" max="+ 2*Math.PI+" value="+selectedObject.rotation.z+">"+
			  "</div>" +
			"</div>" +
			"<hr class='my-1'>"+
			"<div class='mx-3 '>" +
				"<h6 class='float-right'>Scale</h6>"+
			    "<input type='range' class='custom-range' id='scale' min='0.05' step="+selectedObject.scale.x/10+" max="+selectedObject.scale.x*8+" value="+selectedObject.scale.x+">"+
			"</div>" +
			"<div class='row justify-content-center'>" +
				"<button class='btn text-right mb-0' style='font-size: 1.3em'><i class='fa fa-trash'></i></button>"+
				"<button class='btn text-left mb-0' style='font-size: 1.3em' onclick='toggleAxis()'><i class='fa fa-arrows-alt'></i></button>"+
			"</div>" +
		"</div>"
	;
	const coords = "xyz".split("");

	document.querySelector("#edit-panel").innerHTML = htmlValue;

	coords.forEach((a)=>{
		$("#rot"+a.toUpperCase())
		.on("input",function() { 
			selectedObject.rotation[a] = $(this).val();
			selectedObject.onDrag();
		});
	});

	$("#scale").on("input",function() { 
		const val = $(this).val();
		selectedObject.scale.copy({x:val, y:val, z:val});
		selectedObject.onDrag();
	});
}

var setWallHeight = val => wallHeight = val;

let moveAxis= false, axises = [];

function axisAppear(argument) {

	dragControls.deactivate();

	function reposition() {
		axises[0].position.copy(selectedObject.position);
		axises[0].position.x += 15;

		axises[1].position.copy(selectedObject.position);
		axises[1].position.z += 15;

		axises[2].position.copy(selectedObject.position);
		axises[2].position.y += 15;
	}

	let newDraggable = allObjs.filter(({uuid})=> uuid != selectedObject.uuid);

	if (axises.length == 0) {

		const arrowGeometry = new THREE.ConeGeometry(1,4.5,10);
		
		axises[0] = new THREE.Mesh(arrowGeometry, new THREE.MeshBasicMaterial({color:"red"}));
		axises[1] = new THREE.Mesh(arrowGeometry, new THREE.MeshBasicMaterial({color:"blue"}));
		axises[2] = new THREE.Mesh(arrowGeometry, new THREE.MeshBasicMaterial({color:"green"}));

		const order = ["x","z","y"];

		axises.forEach((axis,i) => {
			scene.add(axises[i]);
			axis.axis = true;

			axis.onDrag = () => {
				//console.log(`moving ${order[i]}`);
				if (order[i] != "y" || axis.position.y > 15 )
				selectedObject.position[order[i]] = axis.position[order[i]]-15;
				reposition();
			}
		});
		axises[0].rotateZ(-Math.PI/2);
		axises[1].rotateX(Math.PI/2);
	}
	

	newDraggable.push(axises[0],axises[1],axises[2]);


	dragControls = new THREE.DragControls(newDraggable, camera, renderer.domElement);	

	reposition();
}

function toggleAxis() {
	if (moveAxis) {
		dragControls.deactivate();

		dragControls = new THREE.DragControls(allObjs, camera, renderer.domElement);	
		axises.forEach(axis => scene.remove(axis));
		axises = [];
	} 
	moveAxis = !moveAxis;
}

let shapeVertices = [], shapeEditing = false;

setVertices = function (obj) {

	dragControls.deactivate();

	obj.geometry.vertices.forEach((vert, i)=>{
		if (vert.y < 0) return;

		const m = new THREE.MeshBasicMaterial({color:"green"});
		const g = new THREE.SphereGeometry(1,5,5);

		//obj.rotation.set(0,0,0);
	  	//grid.rotation.set(0,0,0);

	  	const vertSphere = new THREE.Mesh(g, m);
		vertSphere.position.copy(obj.localToWorld(vert));
	  	scene.add(vertSphere);
	  	vertSphere.vertice = true;

	  	shapeVertices.push(vertSphere);

	  	vertSphere.onDrag = () => {
	  		
	  		vert.y = vertSphere.position.y;
	  		vertSphere.position.x = vert.x;
	  		vertSphere.position.z = vert.z;

			fbRef.child(`Land/${i}`).set(vert.y);
	  	};

	});
	
	dragControls = new THREE.DragControls(shapeVertices, camera, renderer.domElement);	

}

function toggleShapeEditor() {
	if (shapeEditing) {
		shapeVertices.forEach(vert => scene.remove(vert));
		shapeEditing = [];

		dragControls.deactivate();
		dragControls = new THREE.DragControls(allObjs, camera, renderer.domElement);	

	} else {
		setVertices(battleMat)
	}

	shapeEditing = !shapeEditing;
}