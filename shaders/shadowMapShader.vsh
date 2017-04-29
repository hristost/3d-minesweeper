uniform mat4 uProjectionMatrix;     
uniform mat4 uModelViewMatrix;   
attribute vec3 aPosition;
void main(void){
  vec4 position = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * position;   
}
