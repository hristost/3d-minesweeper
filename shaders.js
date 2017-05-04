lambertianSingleColorShader = function (gl) {

  var shaderProgram = gl.createProgram();
  var request = new XMLHttpRequest();
  request.open('GET', 'shaders/shader.fsh',false);
  request.send();
  shaderProgram.fragment_shader = request.responseText
  request.open('GET', 'shaders/shader.vsh',false);
  request.send();
  shaderProgram.vertex_shader = request.responseText

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, shaderProgram.vertex_shader);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderProgram.fragment_shader);
  gl.compileShader(fragmentShader);

  // Create the shader program
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  shaderProgram.vertexShader = vertexShader;
  shaderProgram.fragmentShader = fragmentShader;

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
    var str = "";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPosition =  gl.getAttribLocation(shaderProgram, 'aPosition');
  shaderProgram.aNormal =  gl.getAttribLocation(shaderProgram, 'aNormal');
  shaderProgram.aTexturePosition =  gl.getAttribLocation(shaderProgram, 'aTexturePosition');

  shaderProgram.uCameraPosition = gl.getUniformLocation(shaderProgram,"uCameraPosition");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
  shaderProgram.uMaterial = gl.getUniformLocation(shaderProgram,"uMaterial");
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram,"uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram,"uColor");
  shaderProgram.uShadowMap = gl.getUniformLocation(shaderProgram,"uShadowMap");
  shaderProgram.uShadowMatrix = gl.getUniformLocation(shaderProgram,"uShadowMatrix");

  shaderProgram.uMakeCheckerboardGaps = gl.getUniformLocation(shaderProgram,"uMakeCheckerboardGaps");
  shaderProgram.uCheckerboardPosition = gl.getUniformLocation(shaderProgram,"uCheckerboardPosition");
  return shaderProgram;
};

shadowMapShader = function (gl) {

  var shaderProgram = gl.createProgram();
  var request = new XMLHttpRequest();
  request.open('GET', 'shaders/shadowMapShader.fsh',false);
  request.send();
  shaderProgram.fragment_shader = request.responseText
  request.open('GET', 'shaders/shadowMapShader.vsh',false);
  request.send();
  shaderProgram.vertex_shader = request.responseText

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, shaderProgram.vertex_shader);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderProgram.fragment_shader);
  gl.compileShader(fragmentShader);

  // Create the shader program
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  shaderProgram.vertexShader = vertexShader;
  shaderProgram.fragmentShader = fragmentShader;

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
    var str = "";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPosition =  gl.getAttribLocation(shaderProgram, 'aPosition');

  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");

  return shaderProgram;
};

