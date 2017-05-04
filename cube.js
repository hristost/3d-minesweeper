///// CUBE DEFINTION
/////
///// Cube is defined to be centered at the origin of the coordinate reference system. 
///// Cube size is assumed to be 2.0 x 2.0 x 2.0 .
function Cube () {

	this.name = "cube";
	
	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array([
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0
	]);

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array([
		0, 1, 2,  2, 1, 3,  // front
		5, 4, 7,  7, 4, 6,  // back
		4, 0, 6,  6, 0, 2,  // left
		1, 5, 3,  3, 5, 7,  // right
		2, 3, 6,  6, 3, 7,  // top
		4, 5, 0,  0, 5, 1   // bottom
	]);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
	
}
function CheckerboardSurface (w, h) {

	this.name = "surface";
	
	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array([
		0.0, 0.0, 0.0,  
		0.0, 0.0, 1.0,  
		1.0, 0.0, 0.0,  
		1.0, 0.0, 1.0,  
	]);
	this.textureCoordinates = new Float32Array([
      0, 0, 0, h, w, 0, w, h
	]);

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array([
		0, 1, 2,  2, 1, 3,  // front
	]);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
	
}
function Cell () {

	this.name = "cube";
	
	// vertices definition
	////////////////////////////////////////////////////////////
	
    let s = 0.4;
   let h = 0.3;
  let hh = 0.2;
  let w = 0.5;
	this.vertices = new Float32Array([
		-w, -0,  w,//0
		 w, -0,  w,//1
		-w,  hh, w,//2
		 w,  hh, w,//3
		-w,  0, -w,//4
		 w,  0, -w,//5
		-w,  hh, -w,//6
		 w,  hh, -w,//7

		-s,  h,  s,//8--2--0
		 s,  h,  s,//9--3--1
		-s,  h, -s,//10--6--4
		 s,  h, -s//11--7--5
	]);

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array([
		9, 8, 2,  9, 2, 3,  // front
		10, 11, 7,  6, 10, 7,  // back
		10, 6, 8,  8, 6, 2,  // left
		3, 11, 9,  7, 11, 3,  // right
	    2, 0, 1,  2, 1, 3,  // front
	    4, 5, 7,  4, 7, 6,  // back
		4, 0, 6,  6, 0, 2,  // left
		1, 5, 3,  3, 5, 7,  // right
       8, 9, 10 , 10, 9, 11,
		4, 5, 0,  0, 5, 1   // bottom
	]);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
	
}
function Flag () {

	this.name = "flag";
	
	// vertices definition
	////////////////////////////////////////////////////////////
	
	var p = 0;
	var vertices = [0, 0, 0, 0, 1, 0];
	var faces = []
	while(p<1){
		let i = vertices.length/3;
		var z = Math.sin(p*8)*0.1
		vertices = vertices.concat(
		p, p/2, z, p, 1.0-p/2, z)
		faces = faces.concat(i-2, i, i-1, i, i+1, i-1)
		p+= 0.07
	}	
	this.vertices = new Float32Array(vertices);
  this.updateFlag = function(t, gl){

    for (var i = 0; i<this.vertices.length; i+=3){

      x = this.vertices[i];
      this.vertices[i+2] = Math.sin(x*8)*0.05*Math.sin(2*t)+0.2*Math.sin(t)*x
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array(faces);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
	
}
