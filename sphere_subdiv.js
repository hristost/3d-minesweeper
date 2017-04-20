///// CUBE DEFINTION
/////
///// Cube is defined to be centered at the origin of the coordinate reference system. 
///// Cube size is assumed to be 2.0 x 2.0 x 2.0 .
//
function SphereSubdiv (s) {
  this.name = "sphere";

  var vertices = [
    1.0,    0.0,    0.0,
    0.0,    1.0,    0.0,
    -1.0,    0.0,    0.0,
    0.0,   -1.0,    0.0,
    0.0,    0.0,    1.0,
    0.0,    0.0,   -1.0
  ];
  var indices = [
   /* 0, 1, 4,
    0, 1, 5,
    1, 2, 4,
    1, 2, 5,
    2, 3, 4,
    2, 3, 5,
    3, 0, 4,//*/
    3, 0, 5
  ];

  for (var i = 0; i<s; i++){
    var newIndices = []

    let vertexCount = vertices.length/3;

    var midpoints = new Array(vertexCount).fill(0).map(row => new Array(vertexCount).fill(-1)); 
    for (var face = 0; face<indices.length/3; face++){
      let f = face*3;
      let a = indices[f];
      let b = indices[f+1];
      let c = indices[f+2];
      let ax = vertices[a*3];
      let ay = vertices[a*3+1];
      let az = vertices[a*3+2];
      let bx = vertices[b*3];
      let by = vertices[b*3+1];
      let bz = vertices[b*3+2];
      let cx = vertices[c*3];
      let cy = vertices[c*3+1];
      let cz = vertices[c*3+2];

      // Find (mx, my, mz), (nx, ny, nz), (px, py, pz) -- centers of segments
      var m = midpoints[a][b];
      if(m==-1){
        var x = (ax+bx)/2;
        var y = (ay+by)/2;
        var z = (az+bz)/2;
        let l = Math.sqrt(x*x + y*y + z*z);
        x/=l;
        y/=l;
        z/=l;
        m = vertices.length/3;    // The index of the new point
        vertices = vertices.concat([x, y, z]);
        midpoints[a][b] = m;
        midpoints[b][a] = m;
      }
      var n = midpoints[a][c];
      if(n==-1){
        var x = (ax+cx)/2;
        var y = (ay+cy)/2;
        var z = (az+cz)/2;
        let l = Math.sqrt(x*x + y*y + z*z);
        x/=l;
        y/=l;
        z/=l;
        n = vertices.length/3;    // The index of the new point
        vertices = vertices.concat([x, y, z]);
        midpoints[a][c] = n;
        midpoints[c][a] = n;
      }
      var p = midpoints[c][b];
      if(p==-1){
        var x = (cx+bx)/2;
        var y = (cy+by)/2;
        var z = (cz+bz)/2;
        let l = Math.sqrt(x*x + y*y + z*z);
        x/=l;
        y/=l;
        z/=l;
        p = vertices.length/3;    // The index of the new point
        vertices = vertices.concat([x, y, z]);
        midpoints[c][b] = p;
        midpoints[b][c] = p;
      }

      newIndices = newIndices.concat([
        m, a, n,
        m, b, p,
        n, c, p,
        m, n, p
      ]);
    }
    indices = newIndices;
  }

  // Mirror around x
  var mirrorStart = vertices.length;
  vertices = vertices.concat(vertices);
  for(var i = mirrorStart; i<vertices.length; i+=3){
    vertices[i] = -vertices[i];
  }
  var mirrorFacesStart = indices.length;
  indices = indices.concat(indices);
  for (var i = mirrorFacesStart; i<indices.length; i++){
    indices[i]+=mirrorStart/3;
  }
  // Mirror around y
  mirrorStart = vertices.length;
  vertices = vertices.concat(vertices);
  for(var i = mirrorStart+1; i<vertices.length; i+=3){
    vertices[i] = -vertices[i];
  }
  mirrorFacesStart = indices.length;
  indices = indices.concat(indices);
  for (var i = mirrorFacesStart; i<indices.length; i++){
    indices[i]+=mirrorStart/3;
  }
  // Mirror around z
  mirrorStart = vertices.length;
  vertices = vertices.concat(vertices);
  for(var i = mirrorStart+2; i<vertices.length; i+=3){
    vertices[i] = -vertices[i];
  }
  mirrorFacesStart = indices.length;
  indices = indices.concat(indices);
  for (var i = mirrorFacesStart; i<indices.length; i++){
    indices[i]+=mirrorStart/3;
  }
  this.vertices = new Float32Array(vertices);
  this.triangleIndices = new Uint16Array(indices);

  this.numVertices = this.vertices.length/3;
  this.numTriangles = this.triangleIndices.length/3;

}
