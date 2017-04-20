///// CUBE DEFINTION
/////
///// Cube is defined to be centered at the origin of the coordinate reference system. 
///// Cube size is assumed to be 2.0 x 2.0 x 2.0 .
function Tetrahedron () {

	this.name = "tetrahedron";
	
	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array([
      0.0,          Math.sqrt(3)/3.0,   -Math.sqrt(6)/12,
      -0.5,        -Math.sqrt(3)/6.0,   -Math.sqrt(6)/12,
      0.5,         -Math.sqrt(3)/6.0,  -Math.sqrt(6)/12,
      0.0, 0.0, Math.sqrt(6)/3-Math.sqrt(6)/12
    ]);

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array([
		0, 1, 2,
        0, 1, 3,
      0, 2, 3,
      1, 2, 3

	]);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
	
}
