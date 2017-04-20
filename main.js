function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }

    return array;
}
// OpenGL rendering context
var gl = null;

var w = 6;
var h = 8;
var inactiveCellColour = [1, 1, 1, 1]
var activeCellColour = [0.1, 0.9, 0.1, 1]
var direction = 0;
// primitive to render
var cell = new Cell();
var floor = new Cube();
var flagPole = new Cylinder(10);
var flagFlaggyThing = new Flag()
var cellStates = zeros([w, h])

var newPosition = [3, 3]
var currentPosition = [3, 3]
var oldPosition = [3, 3]
var newAngle = 0;
var oldAngle = 0;
var currentAngle = 0;
var animationProgress = 0.0
function start() {
  var canvas = document.getElementById("canvas");
  // Initialize the OpenGL rendering context
  gl = canvas.getContext("experimental-webgl");
  // Only continue if WebGL is available and working
  if (!gl){
	alert("WebGL initialization failed! Your browser does not support WebGL or it is not properly configured.");
	return;
  }		
  initialize(gl, cell)
  initialize(gl, floor)
  initialize(gl, flagPole)
  initialize(gl, flagFlaggyThing)
  setInterval(draw, 20);	
  document.addEventListener('keyup', keyUp, false);
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
function draw() {
  animationProgress = Math.min(1.0, animationProgress+0.15)
  let v = forwardVectorForDirection(direction)
  var canvas = document.getElementById('canvas');
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;

  gl.viewport(0, 0, width, height);

  projMat = SglMat4.perspective(0.8, width/height, 0.1, 1000.0);
  viewMat = SglMat4.lookAt([0,2,6.0], [0,0,0], [0,1,0]);

  gl.clearColor(0.309, 0.505, 0.74, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);


  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let stack = new SglMatrixStack();

  currentPosition = interpolate(oldPosition, newPosition, animationProgress)
  currentAngle = newAngle*animationProgress + oldAngle*(1.0 - animationProgress)
  var modelMat = SglMat4.mul(
	SglMat4.translation([0, 0, 4]),
	SglMat4.mul(
	  SglMat4.rotationAngleAxis(sglDegToRad(currentAngle), [0,1,0]),
	  SglMat4.translation([-currentPosition[0], 0, -currentPosition[1]])

	)
  );
  let modelView= SglMat4.mul(viewMat, modelMat)

  stack.push();
  stack.multiply(modelView);
  gl.uniformMatrix4fv(shaderProgram.uProjectionMatrixLocation, false, projMat);
  gl.uniformMatrix3fv(shaderProgram.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(modelView));
stack.push()

		  stack.multiply(SglMat4.translation([-0.5, 0, -0.5]));
			stack.multiply(SglMat4.scaling([w/2, 0.7, h/2]))
		  stack.multiply(SglMat4.translation([1, -1, 1]));
	  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
	  drawObject(gl, floor, shaderProgram, [0.7, 0.7, 0.7, 1], stack);
stack.pop()
stack.push()
		  stack.multiply(SglMat4.translation([0, 0, -1.5]));
			stack.multiply(SglMat4.scaling([1, 1, h+2]))
		  stack.multiply(SglMat4.translation([-1, 0, 0.5]));
	  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
	  drawObject(gl, cell, shaderProgram, [0.7, 0.7, 0.7, 1], stack);
		  stack.multiply(SglMat4.translation([w+1, 0, 0]));
	  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
	  drawObject(gl, cell, shaderProgram, [0.7, 0.7, 0.7, 1], stack);
stack.pop()
stack.push()
		  stack.multiply(SglMat4.translation([-1.5, 0, 0]));
			stack.multiply(SglMat4.scaling([w+2, 1, 1]))
		  stack.multiply(SglMat4.translation([0.5, 0, -1]));
	  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
	  drawObject(gl, cell, shaderProgram, [0.7, 0.7, 0.7, 1], stack);
		  stack.multiply(SglMat4.translation([0, 0, h+1]));
	  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
	  drawObject(gl, cell, shaderProgram, [0.7, 0.7, 0.7, 1], stack);
stack.pop()
  //  stack.push();primitiveprimitive

  for (var y = 0; y<h; y++){
	stack.push()
	for (var x = 0; x<w; x++){
	  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
	  let distance = Math.pow(x+v[0]-currentPosition[0], 2) + Math.pow(y+v[1]-currentPosition[1], 2)
	  let p = Math.min(1.0, Math.sqrt(distance))
		if (cellStates[x][y]!=1)
	  drawObject(gl, cell, shaderProgram, interpolate(activeCellColour,inactiveCellColour, p), stack);

		if (cellStates[x][y]==2){
		stack.push()
		  stack.multiply(SglMat4.rotationAngleAxis(0.1, [0.1, 0, 0.1]))
		  stack.push()
			stack.multiply(SglMat4.scaling([0.01, 0.7, 0.01]))
			gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
			drawObject(gl, flagPole, shaderProgram, [0.5, 0.5, 0.5, 1], stack)
			stack.pop()
		  stack.multiply(SglMat4.translation([0, 2*0.7-0.3, 0]));
		  stack.multiply(SglMat4.scaling([0.5, 0.3, 1]))
		  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrixLocation, false, stack.matrix);
		  drawObject(gl, flagFlaggyThing, shaderProgram, [1, 0.1, 0.1, 1], stack)
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
  switch(code){
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

		cellStates[newPosition[0] - v[0]][newPosition[1] - v[1]] = 1

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
