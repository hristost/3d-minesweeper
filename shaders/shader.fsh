precision highp float;
varying vec3 vnormal;
varying vec3 vpos;
varying vec2 vtexpos;
uniform vec4 uLightDirection;
// positional light: position and color
uniform vec3 uLightColor; 
uniform vec4 uColor;  
uniform bool uMakeCheckerboardGaps; 

uniform sampler2D uShadowMap;

varying vec4 vshadowpos;
float normalDirection(float f){
    if (f>0.98) return +1.0;
    else if(f>0.02) return 0.0;
    else return -1.0;
    
}
float Unpack(vec4 v){
    return v.x  + v.y / (256.0 ) + v.z/( 256.0*256.0)+v.w/ ( 256.0*256.0*256.0);
    //		return v.x;	
}
void main(){

  // normalize interpolated normal 
  vec3 N = normalize(vnormal); 

  if (uMakeCheckerboardGaps){
    vec2 m =mod(vtexpos,  1.0);
    N = N + 0.5*vec3(normalDirection(m.x), 0, normalDirection(m.y));
  }
  // Compute shadow
  float shadow = 0.0;
  vec2 texelSize = 1.0 / vec2(4096.0, 4096.0);
  vec3 normShadowPos = vshadowpos.xyz/vshadowpos.w;
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

  // diffuse component
  float NdotL = max(0.0, dot(N, L));
  vec3 lambert = (uColor.xyz) * (0.2+0.8*NdotL);
  float dist = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = (16.0 - dist)/(16.0 - 4.0);
  fogFactor = clamp( fogFactor, 0.0, 1.0 );
  gl_FragColor  = vec4(lambert, 1.0)*fogFactor + (1.0-fogFactor)*vec4(0.2, 0.4, 0.6, 1);
    //if(mod(floor(vtexpos.x), 2.0)>0.5)
    gl_FragColor = (0.5+shadow/2.0)*gl_FragColor + (0.5-shadow/2.0)*vec4(0.0, 0.0, 0.0, 1.0);
    //gl_FragColor = vec4(vec3(Fz), 1.0);
}
