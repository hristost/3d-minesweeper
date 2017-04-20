///// CUBE DEFINTION
/////
///// Cube is defined to be centered at the origin of the coordinate reference system. 
///// Cube size is assumed to be 2.0 x 2.0 x 2.0 .
function SphereLatLong (v, h) {
  this.name = "sphere";

  let pi  = Math.PI;
  let verticalLevels = v;  // + 2 dots on top & bottom
  let horizontalSegments = h;

  var vertices = [];
  var indices = [];
  // Build circles
  for (var v = 0; v<verticalLevels; v++){
    // Why 1.5? I don't know, but 1 was too little and 2 was too much
    var elevationAngle = pi/(verticalLevels+2)*(v+1.5)-pi/2.0;
    let z = Math.sin(elevationAngle);
    var horizontalRadius = Math.cos(elevationAngle);
    // Build a circle in the x-y plane
    for (var a = 0; a<horizontalSegments; a++){
      let angle = 2*pi/horizontalSegments*a;
      let x = Math.cos(angle)*horizontalRadius;
      let y = Math.sin(angle)*horizontalRadius;
      vertices = vertices.concat([x, y, z]);
    }
    // Link the circle to the previous one
    if (v>0){
      let levelStart = v * horizontalSegments;
      let prevLevelStart = (v-1) * horizontalSegments;
      // Link triangles
      for (var i = 0; i<horizontalSegments-1; i++){
        indices = indices.concat([levelStart+i, levelStart+i+1, prevLevelStart+i]);
        indices = indices.concat([prevLevelStart+i, prevLevelStart+i+1, levelStart+i+1]);
      }
      indices = indices.concat([levelStart+horizontalSegments-1, levelStart, prevLevelStart+horizontalSegments-1]);
      indices = indices.concat([prevLevelStart+horizontalSegments-1, prevLevelStart, levelStart]);
    }    
  }
  // Add pole vertices
  vertices = vertices.concat([0, 0, -1]);
  vertices = vertices.concat([0, 0, 1]);
  let southPole = vertices.length/3-2;
  let northPole = vertices.length/3-1;
  // Link the first circle with the pole
  let lastLevel = (verticalLevels-1)*horizontalSegments;
  for (var i = 0; i<horizontalSegments-1; i++){
    indices = indices.concat(i, i+1, southPole);
    indices = indices.concat(lastLevel+i, lastLevel+i+1, northPole);
  }
  indices = indices.concat(0, horizontalSegments-1, southPole);
  indices = indices.concat(lastLevel,lastLevel+horizontalSegments-1, northPole);

  this.vertices = new Float32Array(vertices);
  this.triangleIndices = new Uint16Array(indices);

  this.numVertices = this.vertices.length/3;
  this.numTriangles = this.triangleIndices.length/3;

}
