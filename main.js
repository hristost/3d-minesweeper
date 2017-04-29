function zeros(dimensions) {
  var array = [];
  for (var i = 0; i < dimensions[0]; ++i)
    array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
  return array;
}
// OpenGL rendering context
var gl = null;

var w = 10;
var h = 10;
var inactiveCellColour = [1, 1, 1, 1]
var activeCellColour = [0.1, 0.9, 0.1, 1]
var numberColours = [
  [0, 0, 0, 1],
  [0.1, 0.2, 1, 1],
  [0.1, 1, 0.1, 1],
  [1, 0.2, 0, 1],
  [0, 0, 0.9, 1],
  [0.9, 0, 0,1],
  [0, 0.8, 0.8, 1],
  [0, 0, 0, 1],
  [0.4, 0.4, 0.4, 1],
  [0, 0, 0, 1]
]
var direction = 0;
// primitive to render
var shadowMapTextureTarget = null;
var cell = new Cell();
var floor = new CheckerboardSurface(w, h);
var number1 = null
var flagPole = new Cylinder(10);
var flagFlaggyThing = new Flag()
var cellStates = zeros([w, h])
var boardState = createBoard(w, h)

var newPosition = [3, 3]
var currentPosition = [3, 3]
var oldPosition = [3, 3]
var newAngle = 0;
var oldAngle = 0;
var currentAngle = 0;
var animationProgress = 0.0
function validateNoneOfTheArgsAreUndefined(functionName, args) {
  for (var ii = 0; ii < args.length; ++ii) {
    if (args[ii] === undefined) {
      console.error("undefined passed to gl." + functionName + "(" +
        WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
    }
  }
} 
function start() {
  var canvas = document.getElementById("canvas");
  // Initialize the OpenGL rendering context
  gl = canvas.getContext("experimental-webgl");
  gl = WebGLDebugUtils.makeDebugContext(
    gl, undefined, validateNoneOfTheArgsAreUndefined);

  // Only continue if WebGL is available and working
  if (!gl){
    alert("WebGL initialization failed! Your browser does not support WebGL or it is not properly configured.");
    return;
  }		
  initialize(gl, cell)
  initialize(gl, floor)
  initialize(gl, flagPole)
  initialize(gl, flagFlaggyThing)
	shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,4096,4096);
  setInterval(draw, 20);	
  draw()
  document.addEventListener('keyup', keyUp, false);


  initializeGlString(gl)
}
function initializeGlString(gl){


  var loader = new THREE.FontLoader();
  loader.load( 'helvetiker_regular.typeface.json', function ( font ) {
    numbers = []
    for (var i = 0; i<=9; i++){
      numbers[i] = this.objectFromString(String(i), font)
      initialize(gl, numbers[i])
    }
  } );
}
function objectFromString(str, font){

  var obj = {name: "string_"+str}
  var geometry = new THREE.TextGeometry(str, {


    font: font,
    size: 0.5,
    height: 0.05,
    curveSegments: 4,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelEnabled: true

  });

  geometry.computeBoundingBox();
  var o_x = geometry.boundingBox.min.x + (geometry.boundingBox.max.x - geometry.boundingBox.min.x)/2;
  var o_z = geometry.boundingBox.min.z + (geometry.boundingBox.max.z - geometry.boundingBox.min.z)/2;


  var V = []
  var F = []
  for (var f in geometry.faces){
    var face = geometry.faces[f]
    F = F.concat(face.a, face.b, face.c)
  }
  for (var v in geometry.vertices){
    var v1 = geometry.vertices[v]
    V = V.concat(v1.x-o_x, v1.y, v1.z-o_z)
  }
  obj.triangleIndices = new Uint16Array(F)
  obj.vertices = new Float32Array(V)
  obj.numTriangles = obj.triangleIndices.length/3;
  obj.three=geometry

  obj.numVertices = obj.vertices.length/3;
  return obj
}
function forwardVectorForDirection(dd){
  var d = dd
  while(d<0) d+= 8;
  d = d%8;
  var x = (d>=1&&d<=3)?-1:((d>=5&&d<=7)?1:0);
  var y = (d==0||d==1||d==7)?1:((d>=3&&d<=5)?-1:0);
  return [x, y]
}
function interpolate(old, newValues, p){
  var interpolated = old.map((a) => a*(1.0-p))
  for (var i = 0; i<Math.min(interpolated.length, newValues.length); i++){
    interpolated[i] += p*newValues[i]
  }
  return interpolated
}
function draw(){
  animationProgress = Math.min(1.0, animationProgress+0.15)
  currentPosition = interpolate(oldPosition, newPosition, animationProgress)
  currentAngle = newAngle*animationProgress + oldAngle*(1.0 - animationProgress)
  var canvas = document.getElementById('canvas');
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;

  gl.viewport(0, 0, width, height);

   lightMat = SglMat4.mul(SglMat4.ortho([-w, -30, -h], [w, 30, h])
, SglMat4.lookAt([w/2+1,3,h/2+1], [w/2,0,h/2], [0,1,0]))
  makeShadows(lightMat);


	gl.viewport(0, 0, width, height);

  projMat = SglMat4.perspective(0.8, width/height, 0.1, 1000.0);

  viewMat = SglMat4.mul(
    SglMat4.lookAt([0,2,6.0], [0,0,0], [0,1,0]), 
    SglMat4.mul(
      SglMat4.translation([0, 0, 4]),
      SglMat4.mul(
        SglMat4.rotationAngleAxis(sglDegToRad(currentAngle), [0,1,0]),
        SglMat4.translation([-currentPosition[0], 0, -currentPosition[1]])
      )
    )
  )

  gl.useProgram(shaderProgram);
  gl.clearColor(0.309, 0.505, 0.74, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  projMat = SglMat4.mul(projMat, viewMat)
  gl.uniformMatrix4fv(shaderProgram.uProjectionMatrixLocation, false, projMat);
  gl.uniformMatrix4fv(shaderProgram.uShadowMatrix, false, lightMat);

	gl.activeTexture(gl.TEXTURE2);
  	gl.bindTexture(gl.TEXTURE_2D,shadowMapTextureTarget.texture);
	gl.uniform1i(shaderProgram.uShadowMap, 2);


  drawObjects(shaderProgram)

 }
function makeShadows(lMat){

	gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapTextureTarget.framebuffer);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0,0,shadowMapTextureTarget.framebuffer.width,shadowMapTextureTarget.framebuffer.height);
	gl.useProgram(shadowShaderProgram);
    gl.uniformMatrix4fv(shadowShaderProgram.uProjectionMatrixLocation, false, lMat);

	drawObjects(shadowShaderProgram);

	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
function drawObjects(shader) {

  let v = forwardVectorForDirection(direction)

  let stack = new SglMatrixStack();

  stack.push();

  // Floor
  stack.push()
  stack.multiply(SglMat4.translation([-0.5, 0, -0.5]));
  stack.multiply(SglMat4.scaling([w, 1, h]))
  if(shader.uMakeCheckerboardGaps)gl.uniform1i(shader.uMakeCheckerboardGaps, 1.0);
  drawObject(gl, floor, shader, [0.7, 0.7, 0.7, 1], stack);
   if(shader.uMakeCheckerboardGaps) gl.uniform1i(shader.uMakeCheckerboardGaps, 0.0);
  stack.pop()

  // Bars
  stack.push()
  stack.multiply(SglMat4.translation([0, 0, -1.5]));
  stack.multiply(SglMat4.scaling([1, 1, h+2]))
  stack.multiply(SglMat4.translation([-1, 0, 0.5]));
  drawObject(gl, cell, shader, [0.7, 0.7, 0.7, 1], stack);
  stack.multiply(SglMat4.translation([w+1, 0, 0]));
  drawObject(gl, cell, shader, [0.7, 0.7, 0.7, 1], stack);
  stack.pop()
  stack.push()
  stack.multiply(SglMat4.translation([-1.5, 0, 0]));
  stack.multiply(SglMat4.scaling([w+2, 1, 1]))
  stack.multiply(SglMat4.translation([0.5, 0, -1]));
  drawObject(gl, cell, shader, [0.7, 0.7, 0.7, 1], stack);
  stack.multiply(SglMat4.translation([0, 0, h+1]));
  drawObject(gl, cell, shader, [0.7, 0.7, 0.7, 1], stack);
  stack.pop()
  
  //  stack.push();primitiveprimitive

  for (var y = 0; y<h; y++){
    stack.push()
    for (var x = 0; x<w; x++){
      let distance = Math.pow(x+v[0]-currentPosition[0], 2) + Math.pow(y+v[1]-currentPosition[1], 2)
      let p = Math.min(1.0, Math.sqrt(distance))
      if (cellStates[x][y]!=1){
        drawObject(gl, cell, shader, interpolate(activeCellColour,inactiveCellColour, p), stack);
      }else{
        stack.push()
        stack.multiply(SglMat4.translation([0, 0.1, 0]))
        stack.multiply(SglMat4.rotationAngleAxis(sglDegToRad(-currentAngle), [0,1,0]))
        let n = boardState[x][y]
        if(n!=0)
          drawObject(gl, numbers[n], shader, numberColours[n], stack);

        stack.pop()
      }

      if (cellStates[x][y]==2){
        stack.push()
        stack.multiply(SglMat4.rotationAngleAxis(0.1, [0.1, 0, 0.1]))
        stack.push()
        stack.multiply(SglMat4.scaling([0.01, 0.7, 0.01]))
        drawObject(gl, flagPole, shader, [0.5, 0.5, 0.5, 1], stack)
        stack.pop()
        stack.multiply(SglMat4.translation([0, 2*0.7-0.3, 0]));
        stack.multiply(SglMat4.scaling([0.5, 0.3, 1]))
        drawObject(gl, flagFlaggyThing, shader, [1, 0.1, 0.1, 1], stack)
        stack.pop();
      }
      stack.multiply(SglMat4.translation([1, 0, 0]));

    }
    stack.pop()
    stack.multiply(SglMat4.translation([0, 0, 1]));
  }
}

function keyUp(event){
  let code = event.keyCode
  let v = forwardVectorForDirection(direction)
  oldPosition = currentPosition.slice()
  console.log(code)
  switch(code){
     case 77: //M
      break;
    case 78:
      break;
    case 72:	//H
      direction -= 1;
      break;
    case 76:	//L
      direction += 1;
      break;
    case 75:
      newPosition[0] -= v[0]
      newPosition[1] -= v[1]
      break;
    case 74:
      newPosition[0] += v[0]
      newPosition[1] += v[1]
      break;
    case 68: //D

      openCell(newPosition[0]-v[0], newPosition[1]-v[1])

      break;
    case 70: //F
      if (
        cellStates[newPosition[0] - v[0]][newPosition[1] - v[1]] == 2)

        cellStates[newPosition[0] - v[0]][newPosition[1] - v[1]] = 0
      else
        cellStates[newPosition[0] - v[0]][newPosition[1] - v[1]] = 2
  }
  animationProgress = 0.0
  oldAngle = currentAngle;
  newAngle = direction/8*360;

}
function openCell(x, y){

  if (x<0 || y<0 || x>=w || y>=h) return;
  var opened = (cellStates[x][y]==1) ? true : false
  cellStates[x][y] = 1
  if (boardState[x][y] == 0 && ! opened){

    openCell(x, y-1)
    openCell(x, y+1)
    openCell(x-1, y-1)
    openCell(x-1, y-0)
    openCell(x-1, y+1)
    openCell(x+1, y-1)
    openCell(x+1, y-0)
    openCell(x+1, y+1)
  }

}
