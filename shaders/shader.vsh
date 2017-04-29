precision highp float;     

uniform mat4 uProjectionMatrix;     
uniform mat4 uModelViewMatrix;   
uniform mat4 uShadowMatrix;   
attribute vec3 aPosition;  
attribute vec3 aNormal;    
attribute vec2 aTexturePosition;  
varying vec3 vpos;   
varying vec3 vnormal;
varying vec4 vshadowpos;
varying vec2 vtexpos;

uniform bool uMakeCheckerboardGaps; 
void main(){  

  vnormal = (uModelViewMatrix * vec4(aNormal, 1) - uModelViewMatrix*vec4(0, 0, 0, 1)).xyz;

  vec4 position = vec4(aPosition, 1.0);
  vpos = vec3(uModelViewMatrix *  position);  

  vshadowpos = uShadowMatrix * uModelViewMatrix * position;
  vtexpos = aTexturePosition;

  gl_Position = uProjectionMatrix * uModelViewMatrix * position;   
}  
