precision highp float;
varying vec3 vNormal;
varying vec3 vPosition;
uniform vec3 uCameraPosition;
uniform vec3 uMaterial;
varying vec2 vTexturePosition;
uniform vec4 uLightDirection;
// positional light: position and color
uniform vec3 uLightColor; 
uniform vec4 uColor;  
uniform bool uMakeCheckerboardGaps; 
uniform vec2 uCheckerboardPosition;

uniform sampler2D uShadowMap;

varying vec4 vShadowPosition;
float normalDirection(float f){
  if (f>0.98) return +1.0;
  else if(f>0.02) return 0.0;
  else return -1.0;
}
float Unpack(vec4 v){
  return v.x  + v.y / (256.0 ) + v.z/( 256.0*256.0)+v.w/ ( 256.0*256.0*256.0);
}
void main(){
  // Normalize interpolated normal 
  vec3 N = normalize(vNormal); 

  if (uMakeCheckerboardGaps){
    vec2 m =mod(vTexturePosition,  1.0);
    N = N + 0.5*vec3(normalDirection(m.x), 0, normalDirection(m.y));
  }
  // Compute shadow
  float shadow = 0.0;
  vec2 texelSize = 1.0 / vec2(4096.0, 4096.0);
  vec3 normShadowPos = vShadowPosition.xyz/vShadowPosition.w;
  for(int x = -1; x <= 1; ++x)
    for(int y = -1; y <= 1; ++y){
      float i = 0.5;
      vec3  shadowPos     = normShadowPos * i + vec3(1.0-i);
      float Fz = shadowPos.z;
      float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy+vec2(x, y)*texelSize));
      shadow += (Sz < Fz)? 0.0:1.0;
    }
  shadow = shadow/9.0;

  // light vector (positional light)
  vec3 L = normalize(-uLightDirection.xyz);
  vec3 V = normalize(uCameraPosition - vPosition);
  vec3 R = reflect(L, N);
  // diffuse component
  float NdotL = max(0.0, dot(N, L));
  float RdotV = max(0.0, dot(V, R));
  vec3 lambert = (uColor.xyz) * NdotL*shadow;

  if (uMakeCheckerboardGaps){
    vec2 pos = floor(vTexturePosition);
    float d = clamp(distance(pos, uCheckerboardPosition), 0.0, 1.0);
      if (d<1.0)
      lambert = (0.8*(1.0-d)+ 1.0*d)*lambert;
  }
  float k_d = uMaterial[0];
  float k_s = uMaterial[1];
  float k_a = uMaterial[2];
  vec3 specular = vec3(1.0, 1.0, 1.0)*RdotV;
  float dist = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = (16.0 - dist)/(16.0 - 4.0);
  fogFactor = clamp( fogFactor, 0.0, 1.0 );
  gl_FragColor  = mix(vec4(k_a*uColor.xyz + k_d*lambert + k_s*specular, 1.0), vec4(0.2, 0.4, 0.6, 1), 1.0-fogFactor);

  //if(mod(floor(vTexturePosition.x), 2.0)>0.5)
  //gl_FragColor = (0.5+shadow/2.0)*gl_FragColor + (0.5-shadow/2.0)*vec4(0.0, 0.0, 0.0, 1.0);
  //gl_FragColor = vec4(gl_FragCoord.zzz, 1.0);
  //gl_FragColor = vec4(vec3(Fz), 1.0);
}
