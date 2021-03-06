/*
 *      How to use
 *
 * Create an importer object with 'var importer = new objImporter(callbacks)',
 * then feed him chunks of text with 'importer.streamData(stream)'
 * stream should be an object with two methods:
 *  - stream.complete() should return true if this is the last chunk of data
 *    for the file being parsed
 *  - stream.getData() should return a string containing the actual chunk data
 *
 *  The parsing is done synchronously, and the "stream" object should not
 *  change while streamData is called. It is otherwise possible to specify
 *  two methods stream.lock() and stream.unlock() to allow modification of the
 *  stream object while the parsing is being made.
 *
 *  'callbacks' parameter in the constructor allow for the following callbacks
 *  to be specified:
 *   - onEndParsing(model_descriptor) is generated when parsing is complete.
 *     model_descriptor is a valid SpiderGl model descriptor containing the
 *     model data
 *   - requireMtlFile(filename) is generated when a material file include
 *     directive is encountered. Callers who want to use materials can
 *     implement this callback to download the .mtl file resource and feed it
 *     to a mtlParser (see below)
 *  All callbacks are called synchronously from streamData() method
 *
 *  The produced model descriptor has one or more chunks named this way:
 *
 *  g[groupName]_c[chunkSeq]_m[materialName]_chunk
 *
 *  which refer to a binding named
 *
 *  g[groupName]_c[chunkSeq]_m[materialName]_binding
 *
 * [groupName] is the name of the group in the .obj file
 * [chunkSeq] is an integer number to specify multiple chunks originated from
 *   the same group. This is done to overcome the limit of 16bit vertex indexes
 *   of OpenGLES specification
 * [materialName] is the name of the material used for the chunk, as specified
 *   in the .mtl file(s). Depending on the shaders implementation, different
 *   bindings can be added to implement different materials.
 *
 *
 *   Material parser
 * To parse materials files, a class named mtlParser is given. The only method
 * "parseAndAddMtlFile(mtl_text)" simply parses given text as if it were the
 * content of a .mtl file, and adds any material described there in its member
 * dictionary "mtlDescriptor". Materials properties names are the almost always
 * the sames as the .mtl file specification, except for textures whose name is
 * consistently being named map_* even when the specification uses names without
 * the "map_" prefix, e.g. "map_disp". Textures are objects where all texture
 * options are specified as properties (undefined if not specified on .mtl file)
 * and texture filename is stored in the "filename" property
 */

var mtlParser = function (){
    this.mtlDescriptor = {};
}

mtlParser.prototype = {
    parseAndAddMtlFile: function(mtl_text) {
        if (!mtl_text) return;

        var line = null;
        var tk = null;
        
        var Mtl = function(mtl_name){
            this.name = mtl_name;
            this.Ka = [0.2,0.2,0.2]; //defines the ambient color of the material to be (r,g,b). The default is (0.2,0.2,0.2);
            this.Kd = [0.8,0.8,0.8]; //defines the diffuse color of the material to be (r,g,b). The default is (0.8,0.8,0.8);
            this.Ks = [1.0,1.0,1.0]; //defines the specular color of the material to be (r,g,b). This color shows up in highlights. The default is (1.0,1.0,1.0);
            this.d = 1.0; //defines the transparency of the material to be alpha. The default is 1.0 (not transparent at all) Some formats use Tr instead of d;
            this.Ns = 0.0; //defines the shininess of the material to be s. The default is 0.0;
            this.illum = 0; //denotes the illumination model used by the material. illum = 1 indicates a flat material with no specular highlights, so the value of Ks is not used.
                           //illum = 2 denotes the presence   of specular highlights, and so a specification for Ks is required.
        }
        Mtl.prototype = {
            
        }
        
        var currentMtl = null;
        var lines = mtl_text.split("\n");
        var parse_texture = function(tokens,texture) {
            if (!texture) {
			          texture = { type:tokens.shift() }
            }
            if (tokens.length === 1) {
                texture.filename = tokens[0];
                return texture;
            }
            switch (tokens[0][0]) {
                case "-":
                    switch (tokens.shift()) {
                        case "-blendu":
                            texture.blendU = (tokens.shift() === "on");
                            return parse_texture(tokens,texture);
                        case "-blendv":
                            texture.blendV = (tokens.shift() === "on");
                            return parse_texture(tokens,texture);
                        case "-boost":
                            texture.boost = parseFloat(tokens.shift());
                            return parse_texture(tokens,texture);
                        case "-mm":
                            texture.brightness = parseFloat(tokens.shift());
                            texture.contrast = parseFloat(tokens.shift());
                            return parse_texture(tokens,texture);
                        case "-o":
                            var x = parseFloat(tokens.shift());
                            var y = (tokens[0][0] !== "-" && tokens.length !==1)?parseFloat(tokens.shift()):0;
                            var z = (tokens[0][0] !== "-" && tokens.length !==1)?parseFloat(tokens.shift()):0;
                            texture.coordOffset = [x,y,z];
                            return parse_texture(tokens,texture);
                        case "-s":
                            var x = parseFloat(tokens.shift());
                            var y = (tokens[0][0] !== "-" && tokens.length !==1)?parseFloat(tokens.shift()):0;
                            var z = (tokens[0][0] !== "-" && tokens.length !==1)?parseFloat(tokens.shift()):0;
                            texture.coordScale = [x,y,z];
                            return parse_texture(tokens,texture);
                        case "-t":
                            var x = parseFloat(tokens.shift());
                            var y = (tokens[0][0] !== "-" && tokens.length !==1)?parseFloat(tokens.shift()):0;
                            var z = (tokens[0][0] !== "-" && tokens.length !==1)?parseFloat(tokens.shift()):0;
                            texture.turbulence = [x,y,z];
                            return parse_texture(tokens,texture);
                        case "-texres":
                            texture.forceSize = parseInt(tokens.shift());
                            return parse_texture(tokens,texture);
                        case "-clamp":
                            texture.clamp = (tokens.shift() === "on");
                            return parse_texture(tokens,texture);
                        case "-bm":
                            texture.bumpMultiplier = parseFloat(tokens.shift());
                            return parse_texture(tokens,texture);
                        case "-imfchan":
                            texture.imfchan = tokens.shift()[0];
                            return parse_texture(tokens,texture);
                        case "-type":
                            texture.reflType = tokens.shift();
                            return parse_texture(tokens,texture);
                    }
                    break;
                default:
                    //unexpected, probably ill-formed mtl file
                    break;
            }
	      }
        for (var lineIndex in lines) {
            line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");
            
            if (line[0] == "#") continue;
            
            tk = line.split(" ");
            if (tk[0] == "newmtl") {
                currentMtl = new Mtl(tk[1]);
                this.mtlDescriptor[currentMtl.name] = currentMtl;
            }
            else if (tk[0] == "Ka") {
                currentMtl.Ka = [parseFloat(tk[1]),parseFloat(tk[2]),parseFloat(tk[3])];
            }
            else if (tk[0] == "Kd") {
                currentMtl.Kd = [parseFloat(tk[1]),parseFloat(tk[2]),parseFloat(tk[3])];
            }
            else if (tk[0] == "Ks") {
                currentMtl.Ks = [parseFloat(tk[1]),parseFloat(tk[2]),parseFloat(tk[3])];
            }
            else if (tk[0] == "d" || tk[0] == "Tr") {
                currentMtl.d = parseFloat(tk[1]);
            }
            else if (tk[0] == "Ns") {
                currentMtl.Ns = parseFloat(tk[1]);
            }
            else if (tk[0] == "illum") {
                currentMtl.illum = parseInt(tk[1]);
            }
            else if (tk[0] == "map_Ka") {
                currentMtl.map_Ka = parse_texture(tk);
            }
            else if (tk[0] == "map_Kd") {
                currentMtl.map_Kd = parse_texture(tk);
            }
            else if (tk[0] == "map_Ks") {
                currentMtl.map_Ks = parse_texture(tk);
            }
            else if (tk[0] == "map_Ns") {
                currentMtl.map_Ns = parse_texture(tk);
            }
            else if (tk[0] == "map_d") {
                currentMtl.map_d = parse_texture(tk);
            }
            else if (tk[0] == "map_bump"|| tk[0] == "bump") {
                currentMtl.map_bump = parse_texture(tk);
            }
            else if (tk[0] == "disp") {
                currentMtl.map_disp = parse_texture(tk);
            }
            else if (tk[0] == "decal") {
                currentMtl.map_decal = parse_texture(tk);
            }
        }
    }
}

var objImporter = function (callbacks) {
  this.callbacks = callbacks;
  this.unprocessedStream = "";
  this.vertexData = {
    positions:[],
    txtcoords:[],
    normals:[]
  }
  //this.prefs = {interleavedArrays:false};
  this.prefs = {interleavedArrays:true};
  this.groups = {};
  this.activeGroups = { "default":this.getGroup("default") }
  this.mtlDescriptor = {};
  this.mtlname = "";
}

objImporter.prototype = {
  streamData: function(stream) {
    if (stream.lock) stream.lock();
    var completed = stream.completed();
    this.unprocessedStream += stream.getData();
    if (stream.unlock) stream.unlock();
    var lines = ( this.unprocessedStream ).split('\n');
    if (!completed)
      this.unprocessedStream = lines.pop();
    for (var i = 0; i < lines.length; i++)
      this.processLine(lines[i]);
    if (completed)
      this.EOF();
  },
  EOF: function() {
    var modelDescriptor =// importObj(objData);
    {
       version: "0.0.1.0 EXP",
       meta: {
       },
       data: {
           vertexBuffers: {
           },
           indexBuffers: {
           }
       },
       access: {
           vertexStreams: {
           },
           primitiveStreams: {
           }
       },
       semantic: {
           bindings: {
           },
           chunks: {
           }
       },
       logic: {
           parts: {
           }
       },
       control: {
       },
       extra: {
       }
    };

    // default material vertex streams
    /*************************************/
	var materialNames = { "default":true };
    for (var g in this.groups) {
      var currentGroup = this.groups[g];
      for (var c=0; c<currentGroup.chunks.length; ++c) {
        var currentChunk = currentGroup.chunks[c];
        for (var m in currentChunk.materials) {
          var currentMaterial = currentChunk.materials[m];
          if (0 == currentMaterial.indicesArray.length) continue; // default material
          materialNames[m] = true;
        }
      }
    }
    var vertexStreams = modelDescriptor.access.vertexStreams;
    for (var m in materialNames) {
        var materialName = "_mtllib_" + m;
        vertexStreams[materialName + "_ambient_attr"  ] = { value : [ 0.2, 0.2, 0.2, 0.0 ] };
        vertexStreams[materialName + "_diffuse_attr"  ] = { value : [ 0.8, 0.8, 0.8, 1.0 ] };
        vertexStreams[materialName + "_specular_attr" ] = { value : [ 1.0, 1.0, 1.0, 1.0 ] };
        vertexStreams[materialName + "_shininess_attr"] = { value : [ 1.0, 1.0, 1.0, 1.0 ] };
        vertexStreams[materialName + "_alpha_attr"    ] = { value : [ 0.0, 0.0, 0.0, 0.0 ] };
        vertexStreams[materialName + "_illum_attr"    ] = { value : [ 0.0, 0.0, 0.0, 0.0 ] };
    }
    /*************************************/

    //create a VertexStream and PrimitiveStream
    for (var g in this.groups)
    {
      var currentGroup = this.groups[g];
      var gId = "g" + g;
      modelDescriptor.logic.parts[gId+"_part"] = {chunks:[]};
      for (var c =0; c < currentGroup.chunks.length; c++)
      {
        var cId = gId + "_c" + c;
        var currentChunk = currentGroup.chunks[c];
        //add vertex data
        modelDescriptor.data.vertexBuffers[cId+(currentChunk.interleaved?"_vertex_vb":"_pos_vb")] = { typedArray: new Float32Array(currentChunk.positionsArray) };
        modelDescriptor.access.vertexStreams[cId +"_pos_attr"] = { //see glVertexAttribPointer
            buffer: cId + (currentChunk.interleaved?"_vertex_vb":"_pos_vb"),
            size: 3,
            type: SpiderGL.Type.FLOAT32,
            stride: 4 * currentChunk.positionsStride,
            offset: 4 * currentChunk.positionsOffset,
            normalized: false
          };
        if(currentGroup.usingTextureCoordinates)
        {
          if(!currentChunk.interleaved)
            modelDescriptor.data.vertexBuffers[cId + "_txt_vb"] = { typedArray: new Float32Array(currentChunk.txtcoordsArray) };
          modelDescriptor.access.vertexStreams[cId +"_txt_attr"] = { //see glVertexAttribPointer
            buffer: cId + (currentChunk.interleaved?"_vertex_vb":"_txt_vb"),
            size: this.vertexData.txtCoord3d?3:2, 
            type: SpiderGL.Type.FLOAT32,
            stride: 4 * currentChunk.txtcoordsStride,
            offset: 4 * currentChunk.txtcoordsOffset,
            normalized: false
          }; 
          //modelDescriptor.semantic.bindings[g + "_binding"].vertexStreams["TXTCOORD"] = [g+"_txt_attr"];
        }
        if(currentGroup.usingNormals)
        {
          if(!currentChunk.interleaved)
            modelDescriptor.data.vertexBuffers[cId + "_nrm_vb"] = { typedArray: new Float32Array(currentChunk.normalsArray) };
          modelDescriptor.access.vertexStreams[cId +"_nrm_attr"] = { //see glVertexAttribPointer
            buffer: cId + (currentChunk.interleaved?"_vertex_vb":"_nrm_vb"),
            size: 3,
            type: SpiderGL.Type.FLOAT32,
            stride: 4 * currentChunk.normalsStride,
            offset: 4 * currentChunk.normalsOffset,
            normalized: false
          }; 
          //modelDescriptor.semantic.bindings[g + "_binding"].vertexStreams["NORMAL"] = [g+"_nrm_attr"];
        }

        for(var m in currentChunk.materials)
        {
          var mId = cId + "_m" + m;
          var currentMaterial = currentChunk.materials[m];
          if (0 == currentMaterial.indicesArray.length)
            continue;

          modelDescriptor.data.indexBuffers[mId +"_idx_b"] = { typedArray: new Uint16Array(currentMaterial.indicesArray) };
          modelDescriptor.access.primitiveStreams[mId + "_ps"] = { //see glDrawElements
              buffer: mId + "_idx_b",
              mode: SpiderGL.Type.TRIANGLES,
              count: currentMaterial.indicesArray.length,
              type: SpiderGL.Type.UINT16,
              offset: 0
          };

          var currentBinding = (modelDescriptor.semantic.bindings[mId + "_binding"] = { primitiveStreams:{}, vertexStreams:{}});
          currentBinding.vertexStreams["POSITION"] = [cId + "_pos_attr"];
          if(currentGroup.usingTextureCoordinates)
            currentBinding.vertexStreams["TXTCOORD"] = [cId + "_txt_attr"];
          if(currentGroup.usingNormals)
            currentBinding.vertexStreams["NORMAL"] = [cId +"_nrm_attr"];

          /*******************************/
          // link to material attributes
          var materialName = "_mtllib_" + m;
          currentBinding.vertexStreams["AMBIENT"  ] = [materialName + "_ambient_attr"  ];
          currentBinding.vertexStreams["DIFFUSE"  ] = [materialName + "_diffuse_attr"  ];
          currentBinding.vertexStreams["SPECULAR" ] = [materialName + "_specular_attr" ];
          currentBinding.vertexStreams["SHININESS"] = [materialName + "_shininess_attr"];
          currentBinding.vertexStreams["ALPHA"    ] = [materialName + "_alpha_attr"    ];
          currentBinding.vertexStreams["ILLUM"    ] = [materialName + "_illum_attr"    ];
          /*******************************/

          currentBinding.primitiveStreams["FILL"]= [mId +"_ps"];

          modelDescriptor.semantic.chunks[mId+"_chunk"] = {techniques:{common:{binding:mId + "_binding"}}};
          modelDescriptor.logic.parts[gId+"_part"].chunks.push(mId+"_chunk");
        }
      }
    }
    if(this.callbacks.onEndParsing) this.callbacks.onEndParsing(modelDescriptor);
  },
  getGroup: function(groupName) {
    var Group = function(parserObj) {
        this.chunks = [];
        this.usingTextureCoordinates = false;
        this.usingNormals = false;
        this.parserObj = parserObj;
    }
    Group.prototype  = {
      newChunk:function(interleaved) {
        var nc = {
          "interleaved":false,
          positionsArray:[],
          txtcoordsArray:[],
          normalsArray:[],
          positionsStride:3,
          positionsOffset:0,
          txtcoordsStride:3,
          txtcoordsOffset:0,
          normalsStride:3,
          normalsOffset:0,
          materials:{},
          map:[]
          }
        if(interleaved)
        {
          nc.txtcoordsArray = nc.normalsArray = nc.positionsArray;
          nc.normalsStride = nc.txtcoordsStride = nc.positionsStride = 9;
          nc.txtcoordsOffset = 3;
          nc.normalsOffset = 6;
          nc.interleaved = true;
        }
        this.chunks.push(nc);
        return this.chunks.length - 1;
      },
      addFace:function(v1,v2,v3){
        //put the new vertices in the first available chunk vertex array
        var i = 0;
        for (i = 0; i <this.chunks.length; i++)
        {
          var currentChunk = this.chunks[i];
          var positionsArray = this.chunks[i].positionsArray;
          var firstFreeIdx = ( (positionsArray.length + currentChunk.positionsStride - 1) / currentChunk.positionsStride ) | 0; 
          var haveToInsert = 0;
          if(! this.hasVertex.apply(this,[i].concat(v1))) haveToInsert++;
          if(! this.hasVertex.apply(this,[i].concat(v2))) haveToInsert++;
          if(! this.hasVertex.apply(this,[i].concat(v3))) haveToInsert++;
          if (haveToInsert + firstFreeIdx <= 0x10000) 
            break;
        }
        if(i == this.chunks.length) this.newChunk(this.parserObj.prefs.interleavedArrays);
        this.getCurrentMaterial(i).indicesArray.push(
              this.getVertex.apply(this,[i].concat(v1)),
              this.getVertex.apply(this,[i].concat(v2)),
              this.getVertex.apply(this,[i].concat(v3)));
      },
      hasVertex:function(vb,v,vt,vn) {
        map= this.chunks[vb].map
        return undefined !== (map[v] && map[v][vt] && map[v][vt][vn]);
      },
      getVertex:function(vb,v,vt,vn){
        var chunk = this.chunks[vb];
        var map = chunk.map;
        v = v | 0;
        //vt = vt | 0;
        //vn = vn | 0;

        if ( undefined === map[v]) map[v] = {}; 
        if ( undefined === map[v][vt]) map[v][vt] = {}; 
        if ( undefined === map[v][vt][vn])
        {
          var positions = this.parserObj.vertexData.positions;
          var txtcoords = this.parserObj.vertexData.txtcoords;
          var normals = this.parserObj.vertexData.normals;
          var idx = ( (chunk.positionsArray.length + chunk.positionsStride - 1) / chunk.positionsStride ) | 0; 
          if (idx > 0xffff) return undefined;
          var posIdx = idx * chunk.positionsStride + chunk.positionsOffset;
          var txtIdx = idx * chunk.txtcoordsStride + chunk.txtcoordsOffset;
          var nrmIdx = idx * chunk.normalsStride   + chunk.normalsOffset;
          if ((v * 3 + 2) < positions.length) {
            chunk.positionsArray[posIdx + 0] = positions[v*3+0];
            chunk.positionsArray[posIdx + 1] = positions[v*3+1];
            chunk.positionsArray[posIdx + 2] = positions[v*3+2];
          } else throw "no!";

          if (vt >=0 && (vt * 3 + 2) < txtcoords.length) {
            chunk.txtcoordsArray[txtIdx + 0] = txtcoords[vt*3+0];
            chunk.txtcoordsArray[txtIdx + 1] = txtcoords[vt*3+1];
            chunk.txtcoordsArray[txtIdx + 2] = txtcoords[vt*3+2];
            this.usingTextureCoordinates = true;
          } else {
            chunk.txtcoordsArray[txtIdx + 0] = 0.0;
            chunk.txtcoordsArray[txtIdx + 1] = 0.0;
            chunk.txtcoordsArray[txtIdx + 2] = 0.0;
          }


          if (vn >=0 && (vn * 3 + 2) < normals.length) {
            chunk.normalsArray[nrmIdx + 0] = normals[vn*3+0];
            chunk.normalsArray[nrmIdx + 1] = normals[vn*3+1];
            chunk.normalsArray[nrmIdx + 2] = normals[vn*3+2];
            this.usingNormals = true;
          } else {
            chunk.normalsArray[nrmIdx + 0] = 0.0;
            chunk.normalsArray[nrmIdx + 1] = 0.0;
            chunk.normalsArray[nrmIdx + 2] = 0.0;
          }

          map[v][vt][vn] = idx;
        }
        return map[v][vt][vn] | 0;
      },
      getCurrentMaterial:function(vb) {
        if (this.chunks[vb].materials[this.parserObj.mtlname] === undefined)
          this.chunks[vb].materials[this.parserObj.mtlname] = {indicesArray:[]};
        return this.chunks[vb].materials[this.parserObj.mtlname];
      }
    }
    var g = this.groups[groupName];
    if (!g)
      g = new Group(this);
    this.groups[groupName] = g;
    return g;
  }
  ,
  processLine: function(line) {
    var tokens =
      line
      .replace(/\s+/g," ")
      .trim()
      .split(" ");
    var parseVertex = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      this.vertexData.positions.push(x,y,z);
    }
    var parseTxtCoords = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      if (isNaN (z))
        z = 0.0;
      else
        this.vertexData.txtCoord3d = true;
      this.vertexData.txtcoords.push(x,y,z);
    }
    var parseNormals = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      this.vertexData.normals.push(x,y,z);
    }
    var parseFace = function(_v1,_v2,_v3) {
      //skip faces with less than 3 indices
      if(arguments.length < 3) return;
      var mapper = function (txt) {return parseInt(txt) - 1; }
      var v1 = _v1.split('/').map(mapper)
      var v2 = _v2.split('/').map(mapper)
      var v3 = _v3.split('/').map(mapper)
      for(currentGroup in this.activeGroups) {
        this.activeGroups[currentGroup].addFace(v1,v2,v3);
      }
      if (arguments.length > 3)
      {
        // from [0,1,2,3,...] to [0,2,3,...]
        arguments[0] = Array.prototype.shift.call(arguments);       
        parseFace.apply(this,arguments);
      }
    }
    var parseGroup = function(groupName) {
        if(arguments.length >0) {
          parseGroup.apply(this,Array.prototype.slice.call(arguments,1));
          this.activeGroups[groupName] = this.getGroup(groupName);
        } else {
          this.activeGroups = {};
        }
    }
    switch(tokens.shift()) {
      case "v": // vertex data
        parseVertex.apply(this,tokens);
        break;
      case "vt": // texture coordinate data
        parseTxtCoords.apply(this,tokens);
        break;
      case "vn": // normal data
        parseNormals.apply(this,tokens);
        break;
      case "f": // face data (indexes)
        parseFace.apply(this,tokens);
        break;
      case "o": // defines object name
        this.objectName = tokens[0];
        break;
      case "g": // change current group in the current object
        parseGroup.apply(this,tokens); 
        break;
      case "mtllib": // name of material library file
        if(this.callbacks.requireMaterialFile)
          this.callbacks.requireMaterialFile(tokens[0]);
        break;
      case "usemtl":
        this.mtlname = tokens[0]||"";
        break;
      case "s":
    }
  }
}

function sglRequestObj(url, onSuccess) {
	sglRequestText(url, {
		onSuccess : function (req) {
			// load obj and mtl
			/*********************************************/
			var modelDesc = null;
			var objCb = function (modelDescriptor) {
				modelDesc = modelDescriptor;
			};
			var matParser = new mtlParser();
			var mtlCb = function (mtlFileUrl) {
				var content = sglReadText(mtlFileUrl);
				matParser.parseAndAddMtlFile(content);
			};
			var importer = new objImporter({onEndParsing:objCb, requireMaterialFile:mtlCb});
			var stream   = { getData:function() { return req.text; }, completed:function() { return true; }};
			importer.streamData(stream);
			/*********************************************/

			// patch material vertex streams
			/*********************************************/
			var vertexStreams = modelDesc.access.vertexStreams;
			for (var m in matParser.mtlDescriptor) {
				var mtl = matParser.mtlDescriptor[m];
				var materialName = "_mtllib_" + mtl.name;
				vertexStreams[materialName + "_ambient_attr"  ] = { value : [ mtl.Ka[0], mtl.Ka[1], mtl.Ka[2], 0.0 ] };
				vertexStreams[materialName + "_diffuse_attr"  ] = { value : [ mtl.Kd[0], mtl.Kd[1], mtl.Kd[2], 1.0 ] };
				vertexStreams[materialName + "_specular_attr" ] = { value : [ mtl.Ks[0], mtl.Ks[1], mtl.Ks[2], 1.0 ] };
				vertexStreams[materialName + "_shininess_attr"] = { value : [ mtl.Ns,    0.0,       0.0,       0.0 ] };
				vertexStreams[materialName + "_alpha_attr"    ] = { value : [ mtl.d,     0.0,       0.0,       0.0 ] };
				vertexStreams[materialName + "_illum_attr"    ] = { value : [ mtl.illum, 0.0,       0.0,       0.0 ] };
			}
			/*********************************************/

			// deliver model descriptor
			/*********************************************/
			if (onSuccess) {
				onSuccess(modelDesc);
			}
			/*********************************************/
		}
	});
}
