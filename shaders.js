lambertianShader = function (gl) {

var shaderProgram = gl.createProgram();
//line 4, Listing 6.3{
shaderProgram.vertex_shader = "\
precision highp float;                                     \n\
                                                           \n\
uniform mat4 uProjectionMatrix;                            \n\
uniform mat4 uModelViewMatrix;                             \n\
uniform mat3 uViewSpaceNormalMatrix;                       \n\
attribute vec3 aPosition;                                  \n\
attribute vec3 aNormal;                                    \n\
attribute vec4 aDiffuse;                                   \n\
varying vec3 vnormal;                                      \n\
varying vec4 vdiffuse;                                       \n\
                                                           \n\
void main()                                                \n\
{                                                          \n\
  // vertex normal (in view space)                         \n\
 vnormal = normalize(uViewSpaceNormalMatrix * aNormal);    \n\
                                                           \n\
  // color (in view space)                                 \n\
  vdiffuse = aDiffuse;                                     \n\
                                                           \n\
// vertex position (in view space)                         \n\
                                                           \n\
  // output                                                \n\
  gl_Position = uProjectionMatrix *uModelViewMatrix *      \n\
    position;                                              \n\
}                                                          \n\
"; 
//line 35} line 35, listing 6.4{
shaderProgram.fragment_shader = "\
precision highp float;                                     \n\
                                                           \n\
varying vec3 vnormal;                                      \n\
varying vec4 vdiffuse;                                     \n\
uniform vec4 uLightDirection;                              \n\
                                                           \n\
// positional light: position and color                    \n\
uniform vec3 uLightColor;                                  \n\
                                                           \n\
void main()                                                \n\
{                                                          \n\
  // normalize interpolated normal                         \n\
  vec3 N = normalize(vnormal);                             \n\
                                                           \n\
  // light vector (positional light)                       \n\
  vec3 L = normalize(-uLightDirection.xyz);                \n\
                                                           \n\
  // diffuse component                                     \n\
  float NdotL = max(0.0, dot(N, L));                       \n\
  vec3 lambert = (vdiffuse.xyz * uLightColor) * NdotL;     \n\
                                                           \n\
  gl_FragColor  = vec4(lambert, 1.0);                      \n\
} ";



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
  shaderProgram.aPositionIndex = 0;
  shaderProgram.aColorIndex = 1;
  shaderProgram.aNormalIndex = 2;  
  gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, shaderProgram.aColorIndex, "aColor");
  gl.bindAttribLocation(shaderProgram, shaderProgram.aNormalIndex, "aNormal");
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
  

  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
  shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
  shaderProgram.uLightPositionLocation = gl.getUniformLocation(shaderProgram,"uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
  
  return shaderProgram;
};


lambertianSingleColorShader = function (gl) {

 var shaderProgram = gl.createProgram();
    
shaderProgram.vertex_shader = "\
precision highp float;     \n\
   \n\
uniform mat4 uProjectionMatrix;     \n\
uniform mat4 uModelViewMatrix;   \n\
uniform mat3 uViewSpaceNormalMatrix;   \n\
attribute vec3 aPosition;  \n\
attribute vec3 aNormal;    \n\
varying vec3 vpos;   \n\
varying vec3 vnormal;\n\
   \n\
void main()    \n\
{  \n\
  // vertex normal (in view space)     \n\
   \n\
  \n\
// vertex position (in view space)   \n\
  vec4 position = vec4(aPosition, 1.0);\n\
  vpos = vec3(uModelViewMatrix *  position);  \n\
  vnormal = aNormal;\n\
   \n\
   \n\
   \n\
  // output    \n\
  gl_Position = uProjectionMatrix * uModelViewMatrix * position;   \n\
}  \n\
"; 

shaderProgram.fragment_shader = "\
precision highp float;     \n\
   \n\
varying vec3 vnormal;\n\
varying vec3 vpos;   \n\
uniform vec4 uLightDirection;\n\
   \n\
// positional light: position and color\n\
uniform vec3 uLightColor;  \n\
uniform vec4 uColor;    \n\
   \n\
void main()    \n\
{  \n\
  // normalize interpolated normal     \n\
  vec3 N = normalize(vnormal);     \n\
   \n\
  // light vector (positional light)   \n\
  vec3 L = normalize(-uLightDirection.xyz); \n\
   \n\
  // diffuse component     \n\
  float NdotL = max(0.0, dot(N, L));   \n\
  vec3 lambert = (uColor.xyz) * NdotL;    \n\
   float dist = gl_FragCoord.z / gl_FragCoord.w;\n\
  float fogFactor = (16.0 - dist)/(16.0 - 4.0);\n\
     fogFactor = clamp( fogFactor, 0.0, 1.0 );\n\
  gl_FragColor  = vec4(lambert, 1.0)*fogFactor + (1.0-fogFactor)*vec4(0.2, 0.4, 0.6, 1);     \n\
  }  \n\
";


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
  shaderProgram.aPositionIndex = 0;
  shaderProgram.aNormalIndex = 2;  
  gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, shaderProgram.aNormalIndex, "aNormal");
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
  

  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
  shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram,"uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram,"uColor");
  
  return shaderProgram;
};

