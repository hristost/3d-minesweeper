precision highp float;     

uniform mat4 uProjectionMatrix;     
uniform mat4 uModelViewMatrix;   
uniform mat4 uShadowMatrix;   
uniform vec3 uCameraPosition;
uniform vec3 uMaterial;
attribute vec3 aPosition;  
attribute vec3 aNormal;    
attribute vec2 aTexturePosition;  
varying vec3 vPosition;   
varying vec3 vNormal;
varying vec4 vShadowPosition;
varying vec2 vTexturePosition;

uniform bool uMakeCheckerboardGaps; 
void main(){  

  vNormal = (uModelViewMatrix * vec4(aNormal, 1) - uModelViewMatrix*vec4(0, 0, 0, 1)).xyz;

  vec4 position = vec4(aPosition, 1.0);
  vPosition = vec3(uModelViewMatrix *  position);  

  vShadowPosition = uShadowMatrix * uModelViewMatrix * position;
  vTexturePosition = aTexturePosition;

  gl_Position = uProjectionMatrix * uModelViewMatrix * position;   
}  
