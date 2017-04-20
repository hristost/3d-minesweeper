
function vec3add( v3,i,rs){
	v3[i*3] 	+= rs[0];
	v3[i*3+1] += rs[1];
	v3[i*3+2] += rs[2];
}

function vec3eq( v3,i,rs){
	v3 [i*3] 	  = rs [0];
	v3 [i*3+1]  = rs [1];
	v3 [i*3+2]  = rs [2];
}
function ComputeNormalsSmooth(obj) {
	obj.name += "_Normals";

	var nv = obj.vertices.length/3;
	var nt = obj.triangleIndices.length/ 3;
	
	obj.vertex_normal = new Float32Array(nv*3);
	var star_size = new Float32Array(nv);
	
	for( var i = 0 ; i  < nv; ++i){
		star_size[i] = 0;
		obj.vertex_normal[3*i] = 0.0;
		obj.vertex_normal[3*i+1] = 0.0;
		obj.vertex_normal[3*i+2] = 0.0;
	}
	
	for( var i = 0 ; i  < nt; ++i){
		var i_v  = [ obj.triangleIndices[i*3+0], 	obj.triangleIndices[i*3+1], 	obj.triangleIndices[i*3+2]];
		
		var p0 = [obj.vertices[3*i_v[0]+0],obj.vertices[3*i_v[0]+1],obj.vertices[3*i_v[0]+2]];
		var p1 = [obj.vertices[3*i_v[1]+0],obj.vertices[3*i_v[1]+1],obj.vertices[3*i_v[1]+2]];
		var p2 = [obj.vertices[3*i_v[2]+0],obj.vertices[3*i_v[2]+1],obj.vertices[3*i_v[2]+2]];
	
		var p01 = SglVec3.sub(p1,p0);
		var p02 = SglVec3.sub(p2,p0);
		var n = SglVec3.cross(p02,p01);
		
		n = SglVec3.normalize(n);
		
		vec3add(obj.vertex_normal,i_v[0],n);
		vec3add(obj.vertex_normal,i_v[1],n);
		vec3add(obj.vertex_normal,i_v[2],n);
	
		star_size[i_v[0]] += 1;
		star_size[i_v[1]] += 1;
		star_size[i_v[2]] += 1;
	}
	for( var i = 0 ; i  < nv; ++i){
		var n = [ obj.vertex_normal[ 3*i],	obj.vertex_normal[ 3*i+1],	obj.vertex_normal[ 3*i+2] ];

		SglVec3.muls$(n,1.0/star_size[i]);
		n = SglVec3.normalize(n);
		
		vec3eq(obj.vertex_normal,i,[n[0],n[1],n[2]]);
	}
	
	obj.numVertices = nv;
	obj.numTriangles = obj.triangleIndices.length/3;
	return obj;
};
function ComputeNormals(obj) {
  obj.name += "_Normals";

  var nv = obj.vertices.length/3;
  var nt = obj.triangleIndices.length/ 3;



  var newFaces = []
  var newVertices = []
  var newNormals = []
  for( var i = 0 ; i  < nt; ++i){
    var i_v  = [ obj.triangleIndices[i*3+0], 	obj.triangleIndices[i*3+1], 	obj.triangleIndices[i*3+2]];
    var ii = newVertices.length/3;
    var p0 = [obj.vertices[3*i_v[0]+0],obj.vertices[3*i_v[0]+1],obj.vertices[3*i_v[0]+2]];
    var p1 = [obj.vertices[3*i_v[1]+0],obj.vertices[3*i_v[1]+1],obj.vertices[3*i_v[1]+2]];
    var p2 = [obj.vertices[3*i_v[2]+0],obj.vertices[3*i_v[2]+1],obj.vertices[3*i_v[2]+2]];

    newVertices = newVertices.concat(p0)
    newVertices = newVertices.concat(p1)
    newVertices = newVertices.concat(p2)
    newFaces = newFaces.concat(ii, ii+1, ii+2)

    var p01 = SglVec3.sub(p1,p0);
    var p02 = SglVec3.sub(p2,p0);
    var n = SglVec3.cross(p02,p01);

    n = SglVec3.normalize(n);

    newNormals = newNormals.concat(n, n, n)
    console.log(i, newFaces.length)

  }

  obj.vertex_normal = new Float32Array(newNormals)
  obj.triangleIndices = new Uint16Array(newFaces)
  obj.vertices = new Float32Array(newVertices)
  //obj.triangleIndices = newFaces
  //obj.vertex_normal = newNormals
  //obj.vertices = newVertices


  console.log(newVertices, newFaces, nt)
  //obj.numVertices = nv;
  obj.numTriangles = obj.triangleIndices.length/3;
  return obj;
};
