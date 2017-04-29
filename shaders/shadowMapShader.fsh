precision highp float;
float Unpack(vec4 v){
    return v.x  + v.y / (256.0 ) + v.z/( 256.0*256.0)+v.w/ ( 256.0*256.0*256.0);
    //		return v.x;	
}
vec4 pack_depth(const in float d){
    if(d==1.0) return vec4(1.0,1.0,1.0,1.0);
    float a =d*1.002;
    const vec4 bit_shift = vec4( 1.0	, 256.0		,256.0*256.0	,	256.0*256.0*256.0 );
    const vec4 bit_mask  = vec4( 1.0/256.0	, 1.0/256.0	, 1.0/256.0	,	0.0);
    vec4 res = fract(a * bit_shift);
    res -= res.yzwx  * bit_mask;
    return res;
}
void main(void){
  float d = (gl_FragCoord.z+0.0)/1.0;
    gl_FragColor = vec4(pack_depth(gl_FragCoord.z));
  //gl_FragColor = vec4(pack_depth(gl_FragCoord.z).xyz, 1);
}

