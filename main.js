function zeros(dimensions) {
  var array = [];
  for (var i = 0; i < dimensions[0]; ++i)
    array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
  return array;
}
// OpenGL rendering context
var gl = null;

var w = 18;
var h = 18;
var inactiveCellColour = [1, 1, 1, 1]
var activeCellColour = [0.0, 0.2, 0.8, 1]
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
var bombBall = new SphereLatLong(8, 8);
var bombSpike = new Cone(5);
var floor = new CheckerboardSurface(w, h);
var number1 = null
var flagPole = new Cylinder(10);
var flagFlaggyThing = new Flag()
var cellStates = zeros([w, h])
var cellOffsets = zeros([w, h])
var cellRotationAxes = zeros([w, h])
var boardState = createBoard(w, h)

var newExplosionOffset = 0
var oldExplosionOffset = 0
var currentExplosionOffset = 0
var newPosition = [9, 9]
var currentPosition = [9, 9]
var oldPosition = [9, 9]
var newAngle = 0;
var oldAngle = 0;
var currentAngle = 0;
var animationProgress = 0.0

var viNumber = 0;
var viCommand = null;
var viCommandMode = false;
var timeEllapsed = 0;

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
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas()
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
  initialize(gl, flagFlaggyThing, true)
  initialize(gl, bombBall, true)
  initialize(gl, bombSpike, false)
  shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,4096,4096);
  setInterval(draw, 20);	
  computeExplosionTrajectories(8, 8)
  draw()
  document.addEventListener('keyup', keyUp, false);


  initializeGlString(gl)
  viStatusline()
}
function initializeGlString(gl){


  var loader = new THREE.FontLoader();
  loader.load( 'helvetiker_regular.typeface.json', function ( font ) {
    numbers = []
    for (var i = 0; i<=9; i++){
      numbers[i] = this.objectFromString(String(i), font)
      initialize(gl, numbers[i], true)
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

function resizeCanvas() {
  var canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function draw(){
  timeEllapsed += 0.04;
  this.flagFlaggyThing.updateFlag(timeEllapsed, gl)
  animationProgress = Math.min(1.0, animationProgress+0.15)
  currentPosition = interpolate(oldPosition, newPosition, animationProgress)
  currentExplosionOffset = interpolate([oldExplosionOffset], [newExplosionOffset], animationProgress)[0]
  if (animationProgress>0.99)oldExplosionOffset = currentExplosionOffset;
  currentAngle = newAngle*animationProgress + oldAngle*(1.0 - animationProgress)

  var canvas = document.getElementById('canvas');
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;

  gl.viewport(0, 0, width, height);

  lightMat = SglMat4.mul(SglMat4.ortho([-w, -h, -10], [w, h , 10])
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
  gl.clearColor(0.209, 0.505, 0.64, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  projMat = SglMat4.mul(projMat, viewMat)
  //projMat = lightMat;
  gl.uniformMatrix4fv(shaderProgram.uProjectionMatrixLocation, false, projMat);
  gl.uniformMatrix4fv(shaderProgram.uShadowMatrix, false, lightMat);
  gl.uniform3fv(shaderProgram.uCameraPosition, [currentPosition[0], 2, currentPosition[1]+6])

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
function drawBomb(gl, shader, stack){
  material = [0.5, 0.5, 0];
  color = [0, 0, 0, 1];
  stack.push()
  stack.multiply(SglMat4.translation([0, 0.4, 0]))
  stack.multiply(SglMat4.scaling([0.3, 0.3, 0.3]))
  drawObject(gl, bombBall, shader, color, stack, material)
  for(var i = 0; i<8; i++){
    stack.push()
    stack.multiply(SglMat4.rotationAngleAxis(3.14/4*i, [1, 0, 0]))
    stack.multiply(SglMat4.translation([0, 0.9, 0]))

    stack.multiply(SglMat4.scaling([0.3, 0.3, 0.3]))
    drawObject(gl, bombSpike, shader, color, stack, material)
    stack.pop()
  }
  for(var i = 0; i<6; i++){
    stack.push()
    stack.multiply(SglMat4.rotationAngleAxis(3.14/3*i, [1, 0, 0]))
    stack.multiply(SglMat4.rotationAngleAxis(-3.14/4, [0, 0, 1]))
    stack.multiply(SglMat4.translation([0, 0.9, 0]))
    stack.multiply(SglMat4.scaling([0.3, 0.3, 0.3]))
    drawObject(gl, bombSpike, shader, color, stack, material)
    stack.pop()
    stack.push()
    stack.multiply(SglMat4.rotationAngleAxis(3.14/3*i, [1, 0, 0]))
    stack.multiply(SglMat4.rotationAngleAxis(3.14/4, [0, 0, 1]))
    stack.multiply(SglMat4.translation([0, 0.9, 0]))
    stack.multiply(SglMat4.scaling([0.3, 0.3, 0.3]))
    drawObject(gl, bombSpike, shader, color, stack, material)
    stack.pop()
  }
  stack.push()
  stack.multiply(SglMat4.rotationAngleAxis(-3.14/2, [0, 0, 1]))
  stack.multiply(SglMat4.translation([0, 0.9, 0]))
  stack.multiply(SglMat4.scaling([0.3, 0.3, 0.3]))
  drawObject(gl, bombSpike, shader, color, stack, material)
  stack.pop()
  stack.push()
  stack.multiply(SglMat4.rotationAngleAxis(3.14/2, [0, 0, 1]))
  stack.multiply(SglMat4.translation([0, 0.9, 0]))
  stack.multiply(SglMat4.scaling([0.3, 0.3, 0.3]))
  drawObject(gl, bombSpike, shader, color, stack, material)
  stack.pop()
  stack.pop()
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
  if(shader.uMakeCheckerboardGaps)gl.uniform2fv(shader.uCheckerboardPosition, [-v[0]+currentPosition[0], -v[1]+currentPosition[1]]);
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
      stack.push()
      i = 3*currentExplosionOffset
      offset = [cellOffsets[x][y][0]*i, cellOffsets[x][y][1]*i, cellOffsets[x][y][2]*i]

      if(boardState[x][y]==9&&currentExplosionOffset>0){
        stack.push()
        stack.multiply(SglMat4.translation([0, -1+currentExplosionOffset, 0]))
        drawBomb(gl, shader, stack)
        stack.pop()
      }

      if(currentExplosionOffset<0.9){
        stack.multiply(SglMat4.translation(offset))
        stack.multiply(SglMat4.rotationAngleAxis(currentExplosionOffset*3, cellRotationAxes[x][y]))
        if (cellStates[x][y]!=1){
          drawObject(gl, cell, shader, interpolate(activeCellColour,inactiveCellColour, p), stack);
        }else{
          stack.push()
          stack.multiply(SglMat4.translation([0, 0.1, 0]))
          stack.multiply(SglMat4.rotationAngleAxis(sglDegToRad(-currentAngle), [0,1,0]))
          let n = boardState[x][y]
          if(n!=0)
            drawObject(gl, numbers[n], shader, numberColours[n], stack, [0.7, 0.1, 0.3]);
          stack.pop()
        }

        if (cellStates[x][y]==2){
          stack.push()
          stack.multiply(SglMat4.rotationAngleAxis(0.1, [Math.sin(x+y), 0, Math.cos(x+y)]))
          stack.multiply(SglMat4.rotationAngleAxis(sglDegToRad(-currentAngle), [0, 1, 0]))
          stack.push()
          stack.multiply(SglMat4.scaling([0.01, 0.7, 0.01]))
          drawObject(gl, flagPole, shader, [0.5, 0.5, 0.5, 1], stack)
          stack.pop()
          stack.multiply(SglMat4.translation([0, 2*0.7-0.3, 0]));
          stack.multiply(SglMat4.scaling([0.5, 0.3, 1]))
          drawObject(gl, flagFlaggyThing, shader, [1, 0.1, 0.1, 1], stack, [0.5, 0.3, 0.3])
          stack.pop();
        }
      }
      stack.pop();
      stack.multiply(SglMat4.translation([1, 0, 0]));

    }
    stack.pop()
    stack.multiply(SglMat4.translation([0, 0, 1]));
  }
}

function keyUp(event){
  console.log(event)
  let code = event.keyCode
  oldPosition = currentPosition.slice()
  console.log(code, viCommandMode)
  let v = forwardVectorForDirection(direction)
  //65 83 68 70
  if(viCommandMode){
    if (code==13){

      if (viCommand.includes("NEW")){
        console.log("NEW")
boardState = createBoard(w, h)
cellStates = zeros([w, h])

newExplosionOffset = 0
oldExplosionOffset = 0
currentExplosionOffset = 0

timeEllapsed = 0;

      }else{

        console.log(viCommand)
      }
      viNumber = 0;
      viCommandMode = false;
      viCommand = 0;
    }else
    if (code==27){

      viNumber = 0;
      viCommandMode = false;
      viCommand = 0;
    }else

    if (code==8 && viCommandMode){//DEL
      viCommand =  viCommand.substring(0, viCommand.length-1)
      if(viCommand=="")viCommandMode=false;
    }else{


      viCommand+=String.fromCharCode(code)
    }


  }else{

    if( code==186&&event.shiftKey){

      viCommand = ":"
      viCommandMode = true
    }
    if (code==27){

      viNumber = 0;
      viCommandMode = false;
      viCommand = 0;
    }

    if (code>=48&&code<58){
      viNumber *= 10;
      viNumber += code-48;
      console.log(viNumber)
    }
    if (code==8){//DEL
      viNumber -= viNumber%10;
      viNumber /= 10;
      console.log(viNumber)
    }
    switch(code){
      case 65: //A
        executeCurrentCommand()
        for(var i = 0; i<= Math.max(1, viNumber)-1; i++){
          direction -= 1;
          executeCurrentCommand()
        }
        viCommand = null;
        viNumber = 0;
        break;
      case 70: //F
        executeCurrentCommand()
        for(var i = 0; i<= Math.max(1, viNumber)-1; i++){
          direction += 1;
          executeCurrentCommand()
        }
        viCommand = null;
        viNumber = 0;
        break;
      case 37:
      case 72:	//H
        move(6);
        break;
      case 39:
      case 76:	//L
        move(2);
        break;
      case 38:
      case 75:    //K
        move(0)
        break;
      case 40:
      case 74:    //J
        move(4)
        break;
      case 77: // M
        move(3);
        break;
      case 78:
        move(5);
        break;
      case 85:
        move(7);
        break;
      case 73:
        move(1);
        break;
      case 83: //S
        if (viCommand == 'open'){
          openCell(newPosition[0]-v[0], newPosition[1]-v[1])
          viCommand = null;
          viNumber = 0;
        }else{
          viCommand = 'open'
        }

        break;
      case 68: //D
        if (viCommand == 'flag'){
          flagCell(newPosition[0]-v[0], newPosition[1]-v[1])
          viCommand = null;
          viNumber = 0;
        }else{
          viCommand = 'flag'
        }
    }
  }
  animationProgress = 0.0

  oldAngle = currentAngle;
  newAngle = direction/8*360;

  viStatusline();
}
function openCurrentCell(){
  let v = forwardVectorForDirection(direction)
  openCell(newPosition[0]-v[0], newPosition[1]-v[1])
}
function flagCurrentCell(){
  let v = forwardVectorForDirection(direction)
  flagCell(newPosition[0]-v[0], newPosition[1]-v[1])
}
function executeCurrentCommand(){
  if(viCommand == 'flag') flagCurrentCell()
  if(viCommand == 'open') openCurrentCell()
}
function viStatusline(){
  if(viCommandMode){


  document.getElementById("statusline").innerHTML = viCommand;
    return;
  }
  mode = "NORMAL"
  if(viCommand == 'flag') mode = "FLAG"
  if(viCommand == 'open') mode = "OPEN"
  statusline = "["+mode+"]"
  if(viNumber>0){
    statusline += "[+"+viNumber.toString()+"]"

  }
  help = ""
  help += "Flag selected square with <span class=\"key\">D</span> , open with <span class=\"key\">S</span> . "
  help += "To move, use <span class=\"key\">h</span> (left), <span class=\"key\">j</span> (backward), "
  help += "<span class=\"key\">k</span> (forward), <span class=\"key\">l</span> (right) . "
  help += "To turn around, use <span class=\"key\">a</span> (left), <span class=\"key\">f</span> (right)"
  if(viCommand == 'flag') help = "Press <span class=\"key\">d</span> again to flag"
  if(viCommand == 'open') help = "Press <span class=\"key\">s</span> again to open"
  statusline += " <span class=\"help\">"+help+"</span>"

  document.getElementById("statusline").innerHTML = statusline;


}
function flagCell(x, y){

  if (x<0 || y<0 || x>=w || y>=h) return;
  if (
    cellStates[x][y] == 2)

    cellStates[x][y] = 0
  else if (cellStates[x][y]!=1)
    cellStates[x][y] = 2
}
function move(moveDirection){
  let v = forwardVectorForDirection(direction)
  d = direction;
  while(d<0)d+=8;
  moveDirection = (moveDirection+d)%8
  dx = 0;
  dy = 0;
  if(moveDirection<=1 || moveDirection==7) dy = -1;
  if(3<=moveDirection && moveDirection<=5) dy = +1;
  if(1<=moveDirection && moveDirection<=3) dx = +1;
  if(5<=moveDirection && moveDirection<=7) dx = -1;
  executeCurrentCommand()
  for (var i = 0; i<=Math.max(1, viNumber)-1; i++){
    newPosition[0] += dx;
    newPosition[1] += dy;
    if (newPosition[0]<-1) newPosition[0] = -1
    if (newPosition[1]<-1) newPosition[1] = -1
    if (newPosition[0]>w) newPosition[0] = w
    if (newPosition[1]>h) newPosition[1] = h
    executeCurrentCommand()
  }
  viNumber = 0;
  viCommand = null;

}
function openCell(x, y){

  if (x<0 || y<0 || x>=w || y>=h) return;
  var flagged = (cellStates[x][y]==2) ? true : false
  if(flagged)return;
  var opened = (cellStates[x][y]==1) ? true : false
  cellStates[x][y] = 1
  if (boardState[x][y] == 9){ 
    computeExplosionTrajectories(x, y);
    newExplosionOffset = 1.0; return}
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
function computeExplosionTrajectories(ex, ey){

  for(var x=0; x<w; x++)
    for(var y=0; y<h; y++){

      dx = x-ex;
      dy = y-ey;
      dz = 1;
      l = Math.sqrt(dx*dx+dy*dy+dz*dz)
      cellOffsets[x][y] = [dx/l, dz/l, dy/l]
      cellRotationAxes[x][y] = [dy, 0.01, -dx]
    }
}
