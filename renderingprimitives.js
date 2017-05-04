var shaderProgram  = null;
var shadowShaderProgram  = null;
var vertexBuffer = null;
var indexBufferTriangles = null;
var indexBufferEdges = null;
var currentAngle = 0;
var incAngle = 0.3;
var sunLightDirection = SglVec4.normalize([1.5, 2.5, 0.5, 1.0]);

//// Initialize the buffers
////
function createObjectBuffers(gl, obj, n = false) {
  if(!n)ComputeNormals(obj)
  else ComputeNormalsSmooth(obj)
  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  obj.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_normal, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  obj.texturePositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.texturePositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.textureCoordinates, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // create edges
  var edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (var i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};


///// Initialize the shaders
/////
function initShaders(gl) {
  shadowShaderProgram = shadowMapShader(gl)//lambertianSingleColorShader(gl)
  shaderProgram = lambertianSingleColorShader(gl)
  // create the vertex shader
  var vertexShader = shaderProgram.vertexShader

  // create the fragment shader
  var fragmentShader = shaderProgram.fragmentShader

  // Create the shader program
}

function initialize(gl, primitive, n=false) {
  createObjectBuffers(gl, primitive, n);
  initShaders(gl);
  gl.useProgram(shaderProgram)
}

///// Draw the given primitives with solid wireframe
/////
//
function getViewMatrix(gl){

  var canvas = document.getElementById('canvas');
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;

  gl.viewport(0, 0, width, height);

  projMat = SglMat4.perspective(0.8, width/height, 0.1, 1000.0);
  viewMat = SglMat4.lookAt([0,2,6], [0,0,0], [0,1,0]);
}
function drawObject(gl, obj, shader, fillColor, stack, material = [0.85, 0.0, 0.15]) {
      gl.uniformMatrix4fv(shader.uModelViewMatrixLocation, false, stack.matrix);
  // Draw the primitive
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(shader.aPosition);
  gl.vertexAttribPointer(shader.aPosition, 3, gl.FLOAT, false, 0, 0);

  if (shader.uMaterial)
    gl.uniform3fv(shader.uMaterial, material);
  if (shader.aColorIndex && obj.colorBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.enableVertexAttribArray(shader.aColorIndex);
    gl.vertexAttribPointer(shader.aColorIndex, 4, gl.FLOAT, false, 0, 0);
  }


  if (shader.aNormal!=null){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.enableVertexAttribArray(shader.aNormal);
    gl.vertexAttribPointer(shader.aNormal, 3, gl.FLOAT, false, 0, 0);
  }

  if (shader.aTexturePosition!=null){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texturePositionBuffer);
    gl.enableVertexAttribArray(shader.aTexturePosition);
    gl.vertexAttribPointer(shader.aTexturePosition, 2, gl.FLOAT, false, 0, 0);
  }

  if (shader.uColorLocation!=null){
    gl.uniform4fv(shader.uColorLocation, fillColor);
    gl.uniform4fv(shader.uLightColorLocation, [1, 1, 1, 1]);
    gl.uniform4fv(shader.uLightDirectionLocation, sunLightDirection);
  }

  gl.enable(gl.POLYGON_OFFSET_FILL);

  gl.polygonOffset(1.0, 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

};



TextureTarget = function () {
  this.framebuffer = null;
  this.texture = null;
};
function prepareRenderToTextureFrameBuffer(gl, generateMipmap, w, h) {
  var textureTarget = new TextureTarget();
  textureTarget.framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, textureTarget.framebuffer);

  if (w) textureTarget.framebuffer.width = w;
  else textureTarget.framebuffer.width = 512;
  if (h) textureTarget.framebuffer.height = h;
  else textureTarget.framebuffer.height = 512;;

  textureTarget.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textureTarget.texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureTarget.framebuffer.width, textureTarget.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  if (generateMipmap) gl.generateMipmap(gl.TEXTURE_2D);

  var renderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, textureTarget.framebuffer.width, textureTarget.framebuffer.height);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureTarget.texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return textureTarget;
}//line 44}
