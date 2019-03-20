"use strict";

/**
 * Utils object contains some useful functions for use with WebGL.
 * Minimum browser support (syntax-wise, NOT function-wise) (mainly because arrow functions): Edge 12+, Chrome 45+, FF 22+, Opera 32+, Safari 10
 * It intentionally doesn't support anything that wouldn't work with used syntax.
 * @type {Object}
 * @author Milan Košťák
 * @version 2.0 (2017)
 * @requires transforms3d.js
 */
var Utils = {};

/**
 * Initialization of WebGL
 * @param  {HTMLCanvasElement} canvas to draw on
 * @param  {Object} args optional parameter containing arguments for WebGL initialization
 * @return {WebGLRenderingContext} WebGL context
 */
Utils.initWebGL = function(canvas, args) {
	let gl;
	try {
		gl = canvas.getContext("experimental-webgl", args);
	}
	catch(e) {}
	if (!gl) {
		window.alert("Initialization of WebGL was not successful. Your browser probably doesn't support it.");
		return false;
	}
	return gl;
};

/**
 * Initialization of repainting loop. Uses window.requestAnimationFrame where available.
 * If fps param is set then uses window.setTimeout function.
 * @param  {number} fps number of frames per second to draw, if set then window.setTimeout is used
 */
Utils.initRequestAnimationFrame = function(fps) {
	if (typeof fps === "number") {
		window.requestAnimFrame = function(callback) {
			window.setTimeout(callback, 1000/fps);
		};
	} else {
		// Edge 12+, FF 23+, Chrome 24+, Opera 15+, Safari 6.1+
		window.requestAnimFrame = window.requestAnimationFrame;
	}
};

/**
 * Function for initialization of shaders
 * @param  {WebGLRenderingContext} gl WebGL context
 * @param  {WebGLProgram} program     WebGL program
 * @param  {string} vsId              id of element which is containing vertex shader
 * @param  {string} fsId              id of element which is containing fragment shader
 * @return {boolean}                  true if compilation was successful else it throws exception
 * @throws {SyntaxError}              If compilation of shaders failed or shaders were not found
 */
Utils.initShaders = function(gl, program, vsId, fsId) {
	let initShader = function(id, type) {
		let shader = gl.createShader(type);
		let value;
		try {
			value = document.getElementById(id).firstChild.nodeValue;
		} catch (e) {
			let x = "Utils.initShaders: ";
			x += (type === gl.VERTEX_SHADER) ? "Vertex" : "Fragment";
			x += " shader was not found!";
			window.alert(x);
			throw new Error(x);
		}
		gl.shaderSource(shader, value);
		gl.compileShader(shader);
		// window.console.log(gl.getExtension('WEBGL_debug_shaders').getTranslatedShaderSource(shader));
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			let x = (type === gl.VERTEX_SHADER) ? "Vertex shader error\n" : "Fragment shader error\n";
			x += gl.getShaderInfoLog(shader);
			window.alert(x);
			window.console.log(x);
			return false;
		} else {
			gl.attachShader(program, shader);
			return true;
		}
	};
	// check FS even if VS compilation failed (so it shows errors for both at once)
	let result = (initShader(vsId, gl.VERTEX_SHADER)) & (initShader(fsId, gl.FRAGMENT_SHADER));
	if (!result) {
		throw new SyntaxError("Shader syntax error.");
	} else {
		return true;
	}
};

/**
 * Returns number of pixels mouse has moved
 * @param  {MouseEvent} e
 * @return {Object} object with "x" and "y" properties holding values
 */
Utils.getMousePoint = function(e) {
	let point = {};
	point.x = e.offsetX || 0;
	point.y = e.offsetY || 0;
	return point;
};

/**
 * Returns number of virtual pixels mouse has moved when the pointer is locked
 * @param  {MouseEvent} e
 * @return {Object} object with "x" and "y" properties holding values
 */
Utils.getLockedMousePoint = function(e) {
	let point = {};
	point.x = e.movementX || 0;
	point.y = e.movementY || 0;
	return point;
};

/**
 * Returns number of steps done by mouse wheel
 * @param  {MouseEvent} e
 * @return {number} number of steps
 */
Utils.getWheelRotation = function(e) {
	// FF doesn't know e.wheelDelta
	return e.wheelDelta || e.detail;
};

/**
 * Encapsulation of assigning listener for mouse wheel
 * @param {HTMLElement} element to which assign the listener
 * @param {Function} callback with actual listener
 */
Utils.addMouseWheelListener = function(element, callback) {
	// https://developer.mozilla.org/en-US/docs/Web/Events/wheel#Browser_compatibility
	element.addEventListener("wheel", callback, false);
};

/**
 * Calculates distance of two points in 2D plane
 * @param  {number} x  1st point
 * @param  {number} y  1st point
 * @param  {number} x2 2nd point
 * @param  {number} y2 2nd point
 * @return {number}    distance
 */
Utils.distance = function(x, y, x2, y2) {
	return Math.sqrt(
		Math.pow((y2-y), 2) + Math.pow((x2-x), 2)
	);
};

/**
 * Function for converting matrix or vector into Float32Array
 * @param  {various} a    Vec1D / Vec2D / Vec3D / Point3D / Mat3 / Mat4
 * @return {Float32Array} flat array with values from parameter
 */
Utils.convert = function(a) {
	if (a instanceof Vec1D) {
		return new Float32Array([a.x]);
	} else if (a instanceof Vec2D) {
		return new Float32Array([a.x, a.y]);
	} else if (a instanceof Vec3D) {
		return new Float32Array([a.x, a.y, a.z]);
	} else if (a instanceof Point3D) {
		return new Float32Array([a.x, a.y, a.z, a.w]);
	} else if (a instanceof Mat3) {
		let temp = new Float32Array(9);
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				temp[i*3+j] = a.mat[i][j];
			}
		}
		return temp;
	} else if (a instanceof Mat4) {
		let temp = new Float32Array(16);
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				temp[i*4+j] = a.mat[i][j];
			}
		}
		return temp;
	}
};

/**
 * Object for working with objects in the scene
 * Allows generating of vertices, normals, colors, texture coordinates and indices for a few basic objects (currently Block, Face, Sphere)
 * @constructor
 */
Utils.Scene = function() {
	this.vertices = [];
	this.colors = [];
	this.textureCoords = [];
	this.normals = [];
	this.indices = [];
};

/**
 * Adding an object to the scene
 * @param {various} obj an object to add (Block, Face, Sphere)
 */
Utils.Scene.prototype.add = function(obj) {
	let length = this.vertices.length/3;
	this.vertices = this.vertices.concat(obj.vertices);
	this.colors = this.colors.concat(obj.colors);
	this.textureCoords = this.textureCoords.concat(obj.textureCoords).filter(n => n !== undefined);
	this.normals = this.normals.concat(obj.normals).filter(n => n !== undefined);
	let b = obj.indices;

	for (let i = 0; i < b.length; i++) {
		b[i] = b[i]+length;
	}
	this.indices = this.indices.concat(b);
	return this;
};

/**
 * Create a block
 * @param {number} a     side length a
 * @param {number} b     side length b
 * @param {number} c     side length c
 * @param {number} posx  position of the center of the block
 * @param {number} posy  position of the center of the block
 * @param {number} posz  position of the center of the block
 * @param {Object} args  additional arguments
 *                       - color {Array} color as array (of usually three items); if undefined then RGB block
 *                       - sharedVertices {boolean} if there should be separate vertices for every face (false),
 *                                                  or if faces can share them (true, default value)
 *                                                  if vertices are shared, then normals and texture coordinates are not generated
 * @constructor
 */
Utils.Block = function(a, b, c, posx, posy, posz, args) {
	if (args === undefined) args = {};
	if (args.sharedVertices === undefined) args.sharedVertices = true;

	this.vertices = this.createVertices(a, b, c, posx, posy, posz, args.sharedVertices);
	this.colors = this.createColors(args.color, args.sharedVertices);
	if (!args.sharedVertices) {
		this.textureCoords = this.createTextureCoords();
		this.normals = [];// TODO not implemented yet
	}
	this.indices = this.createIndices(args.sharedVertices);
};

/**
 * Generate vertices for block
 * @param  {number} a               side length a
 * @param  {number} b               side length b
 * @param  {number} c               side length c
 * @param  {number} x               position of the center of the block
 * @param  {number} y               position of the center of the block
 * @param  {number} z               position of the center of the block
 * @param  {boolean} sharedVertices if faces are sharing vertices (more info in constructor)
 * @return {Array}                  array with vertices
 */
Utils.Block.prototype.createVertices = function(a, b, c, x, y, z, sharedVertices) {
	let vertices = [];
	// if shared then 8 vertices
	if (sharedVertices) {
		//front face
		//bottom, left
		vertices.push(-a+x, -b+y, c+z);
		//bottom, right
		vertices.push(a+x, -b+y, c+z);
		//top, left
		vertices.push(-a+x, b+y, c+z);
		//top, right
		vertices.push(a+x, b+y, c+z);
		//right face
		//bottom, right
		vertices.push(a+x, -b+y, -c+z);
		//top, right
		vertices.push(a+x, b+y, -c+z);
		//left face
		//bottom, left
		vertices.push(-a+x, -b+y, -c+z);
		//top, left
		vertices.push(-a+x, b+y, -c+z);
	}
	// if not shared then 24 vertices
	else {
		//front
		vertices.push(-a+x, -b+y, -c+z);
		vertices.push(a+x, -b+y, -c+z);
		vertices.push(-a+x, -b+y, c+z);
		vertices.push(a+x, -b+y, c+z);

		// right face
		vertices.push(a+x, -b+y, -c+z);
		vertices.push(a+x, b+y, -c+z);
		vertices.push(a+x, -b+y, c+z);
		vertices.push(a+x, b+y, c+z);

		// left face
		vertices.push(-a+x, -b+y, -c+z);
		vertices.push(-a+x, -b+y, c+z);
		vertices.push(-a+x, b+y, -c+z);
		vertices.push(-a+x, b+y, c+z);

		// top face
		vertices.push(-a+x, -b+y, c+z);
		vertices.push(a+x, -b+y, c+z);
		vertices.push(-a+x, b+y, c+z);
		vertices.push(a+x, b+y, c+z);

		// bottom face
		vertices.push(-a+x, -b+y, -c+z);
		vertices.push(-a+x, b+y, -c+z);
		vertices.push(a+x, -b+y, -c+z);
		vertices.push(a+x, b+y, -c+z);

		// back face
		vertices.push(-a+x, b+y, -c+z);
		vertices.push(-a+x, b+y, c+z);
		vertices.push(a+x, b+y, -c+z);
		vertices.push(a+x, b+y, c+z);
	}
	return vertices;
};

/**
 * Generate colors for block
 * @param  {Array} color            color as array; if undefined then RGB block
 * @param  {boolean} sharedVertices if colors should be generated for block with shared vertices (more info in constructor)
 * @return {Array}                  array with colors
 */
Utils.Block.prototype.createColors = function(color, sharedVertices) {
	let colors = [];
	// if color was set then copy it to every vertice
	if (color !== undefined) {
		// copy one colors to all vertices
		let max = (sharedVertices) ? 8 : 24;
		for (let i = 0; i < max; i++) {
			for (let j = 0; j < color.length; j++) {
				colors.push(color[j]);
			}
		}
	} else {
		if (sharedVertices) {
			//front face
			//bottom, left
			colors.push(0.0, 0.0, 1.0);
			//bottom, right
			colors.push(1.0, 0.0, 1.0);
			//top, left
			colors.push(0.0, 1.0, 1.0);
			//top, right
			colors.push(1.0, 1.0, 1.0);
			//right face
			//bottom, right
			colors.push(1.0, 0.0, 0.0);
			//top, right
			colors.push(1.0, 1.0, 0.0);
			//left face
			//bottom, left
			colors.push(0.0, 0.0, 0.0);
			//top, left
			colors.push(0.0, 1.0, 0.0);
		} else {
			// front
			colors.push(0.0, 0.0, 1.0);
			colors.push(0.0, 0.0, 1.0);
			colors.push(0.0, 0.0, 1.0);
			colors.push(0.0, 0.0, 1.0);
			// right
			colors.push(0.0, 1.0, 1.0);
			colors.push(0.0, 1.0, 1.0);
			colors.push(0.0, 1.0, 1.0);
			colors.push(0.0, 1.0, 1.0);
			// left
			colors.push(1.0, 0.0, 1.0);
			colors.push(1.0, 0.0, 1.0);
			colors.push(1.0, 0.0, 1.0);
			colors.push(1.0, 0.0, 1.0);
			// top
			colors.push(1.0, 1.0, 0.0);
			colors.push(1.0, 1.0, 0.0);
			colors.push(1.0, 1.0, 0.0);
			colors.push(1.0, 1.0, 0.0);
			// bottom
			colors.push(0.2, 0.2, 0.2);
			colors.push(0.2, 0.2, 0.2);
			colors.push(0.2, 0.2, 0.2);
			colors.push(0.2, 0.2, 0.2);
			// back
			colors.push(1.0, 1.0, 1.0);
			colors.push(1.0, 1.0, 1.0);
			colors.push(1.0, 1.0, 1.0);
			colors.push(1.0, 1.0, 1.0);
		}
	}
	return colors;
};

/**
 * Generate texture coordinates for block, called only when block does not have shared vertices
 * @since 2.0
 * @return {Array} array with texture coords, always the same array
 */
Utils.Block.prototype.createTextureCoords = function() {
	return [
		0, 0,
		1, 0,
		0, 1,
		1, 1,

		0, 0,
		1, 0,
		0, 1,
		1, 1,

		0, 0,
		1, 0,
		0, 1,
		1, 1,

		0, 0,
		1, 0,
		0, 1,
		1, 1,

		0, 0,
		1, 0,
		0, 1,
		1, 1,

		0, 0,
		1, 0,
		0, 1,
		1, 1
	];
};

/**
 * Generate indices for block
 * @param  {boolean} sharedVertices if block has shared vertices (more info in constructor)
 * @return {Array}                  array with indices, always the same regarding the sharedVertices parameter
 */
Utils.Block.prototype.createIndices = function(sharedVertices) {
	if (sharedVertices) {
		return [
			//front
			0, 1, 2,  1, 3, 2,
			//right
			1, 4, 3,  4, 5, 3,
			//left
			6, 0, 7,  0, 2, 7,
			//top
			2, 3, 7,  3, 5, 7,
			//bottom
			6, 4, 0,  4, 1, 0,
			//back
			4, 6, 5,  6, 7, 5
		];
	} else {
		return [
			//front
			0, 1, 2,  1, 3, 2,
			//right
			4, 5, 6,  5, 7, 6,
			//left
			8, 9, 10,  9, 11, 10,
			//top
			12, 13, 14,  13, 15, 14,
			//bottom
			16, 17, 18,  17, 19, 18,
			//back
			20, 21, 22,  21, 23, 22
		];
	}
};

/**
 * Create a face
 * @param {number} a     side length a
 * @param {number} b     side length b
 * @param {number} x     position of the center of the face
 * @param {number} y     position of the center of the face
 * @param {number} z     position of the center of the face
 * @param {Object} args  additional arguments
 *                       - color {Array}  color as array; if undefined then RGB
 *                       - strip {boolean} if indices should be generated for drawing as a triangle strip (true is default)
 *                       - orientation {Mat3} rotation matrix describing rotation over face center (default Mat3Identity)
 * @constructor
 */
Utils.Face = function(a, b, x, y, z, args) {
	if (args === undefined) args = {};
	if (args.strip === undefined) args.strip = true;
	if (args.orientation === undefined) args.orientation = new Mat3Identity();

	this.vertices = this.createVertices(a, b, x, y, z, args.orientation);
	this.colors = this.createColors(args.color);
	this.textureCoords = this.createTextureCoords();
	this.normals = this.createNormals(new Vec3D(x, y, z), this.vertices);
	this.indices = this.createIndices(args.strip);
};

/**
 * Generate vertices for face
 * @param  {number} a side length
 * @param  {number} b side length
 * @param  {number} x position of the center of the face
 * @param  {number} y position of the center of the face
 * @param  {number} z position of the center of the face
 * @param  {Mat3} or  rotation matrix describing rotation over face center (default Mat3Identity)
 * @return {Array}    array with vertices
 */
Utils.Face.prototype.createVertices = function(a, b, x, y, z, or) {

	//bottom, left
	let point1 = new Vec3D(-a, -b, 0).mul(or);
	//bottom, right
	let point2 = new Vec3D(a, -b, 0).mul(or);
	//top, left
	let point3 = new Vec3D(-a, b, 0).mul(or);
	//top, right
	let point4 = new Vec3D(a, b, 0).mul(or);

	let vertices = [];
	vertices.push(point1.x + x, point1.y + y, point1.z + z);
	vertices.push(point2.x + x, point2.y + y, point2.z + z);
	vertices.push(point3.x + x, point3.y + y, point3.z + z);
	vertices.push(point4.x + x, point4.y + y, point4.z + z);

	return vertices;
};

/**
 * Generate colors for face
 * @param  {number} color color as an array; if undefined then RGB
 * @return {Array}        array with colors
 */
Utils.Face.prototype.createColors = function(color) {
	let colors = [];
	if (color !== undefined) {
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < color.length; j++) {
				colors.push(color[j]);
			}
		}
	} else {
		//bottom, left
		colors.push(1.0, 0.0, 0.0);
		//bottom, right
		colors.push(0.0, 1.0, 0.0);
		//top, left
		colors.push(0.0, 0.0, 1.0);
		//top, right
		colors.push(1.0, 1.0, 1.0);
	}
	return colors;
};

/**
 * Generate texture coordinates for face
 * @since 2.0
 * @return {Array} array with texture coords, always the same array
 */
Utils.Face.prototype.createTextureCoords = function() {
	return [
		0, 1,
		1, 1,
		0, 0,
		1, 0
	];
};

/**
 * Generate normals for face
 * @param  {Vec3D} pos      position of the center
 * @param  {Array} vertices vertices array
 * @return {Array}          array with normals
 */
Utils.Face.prototype.createNormals = function(pos, vertices) {
	let normals = [];
	let pom = [];
	for (let i = 0; i < vertices.length; i+=3) {
		pom = Utils.convert(
			new Vec3D(vertices[i]-pos.x, vertices[i+1]-pos.y, vertices[i+2]-pos.z).normalized()
		);
		normals.push(pom[0], pom[1], pom[2]);
	}
	return normals;
};

/**
 * Generate indices for face
 * @param  {boolean} strip if face is going to be drawn with triangle strip
 * @return {Array}         array with indices
 */
Utils.Face.prototype.createIndices = function(strip) {
	if (strip) {
		return [0, 0, 1, 2, 3, 3];
	} else {
		return [0, 1, 2, 1, 3, 2];
	}
};

/**
 * Create a sphere
 * @param {number} posx      position of the center of the sphere
 * @param {number} posy      position of the center of the sphere
 * @param {number} posz      position of the center of the sphere
 * @param {number} radius    radius of the sphere
 * @param {number} precision number of steps over the equator and the meridian, must be the same value
 *                           has big impact on resulting number of vertices
 *                           works only for even numbers
 *                           the higher the number is the more the "sphere" looks like an actual sphere
 *                           if equals 2 then it creates regular octahedron
 * @param {Object} args      additional arguments
 *                           - color {Array} color of sphere (default white [1, 1, 1])
 *                           - strip {boolean} if indices should be generated for triangle strip (default true)
 *                           - randomColor {boolean} if true then colors are going to be random for every vertice (default false)
 * @constructor
 */
Utils.Sphere = function(posx, posy, posz, radius, precision, args) {
	if (args === undefined) args = {};
	if (args.color === undefined) args.color = [1, 1, 1];
	if (args.strip === undefined) args.strip = true;
	if (args.randomColor === undefined) args.randomColor = false;

	let pos = new Vec3D(posx, posy, posz);
	this.vertices = this.createVertices(pos, radius, precision);
	this.colors = this.createColors(this.vertices.length/3, args.color, args.randomColor);
	this.normals = this.createNormals(pos, this.vertices);
	this.textureCoords = this.createTextureCoords(precision);
	this.indices = this.createIndices(precision, args.strip);
};

/**
 * Generate vertices for sphere
 * @param  {Vec3D} pos        position of the center
 * @param  {number} radius    radius of sphere
 * @param  {number} precision number of steps
 * @return {Array}            array with vertices
 */
Utils.Sphere.prototype.createVertices = function(pos, radius, precision) {
	let step = Math.PI/precision;
	let vertices = [];
	let x, y, z;
	for (let fi = 0, round1 = 0; round1 <= precision; fi+=step, round1++) {
		x = pos.x + radius * Math.cos(fi);// * Math.cos(0) == 1
		y = pos.y + radius * Math.sin(fi);// * Math.cos(0) == 1
		z = pos.z;// + radius * Math.sin(0) -> +0
		vertices.push(x, y, z);
		for (let psi = step, round2 = 1; round2 < 2*precision; psi+=step, round2++) {
			x = pos.x + radius * Math.cos(fi) * Math.cos(psi);
			y = pos.y + radius * Math.sin(fi) * Math.cos(psi);
			z = pos.z + radius * Math.sin(psi);
			vertices.push(x, y, z);
		}
	}
	return vertices;
};

/**
 * Generate colors for sphere
 * @param  {number} count   number of vertices the sphere has
 * @param  {Array} color    array with colors; ignored if (random === true)
 * @param  {boolean} random if color should be random for every vertice
 * @return {Array}          array with colors
 */
Utils.Sphere.prototype.createColors = function(count, color, random) {
	let colors = [];
	if (random) {
		for (let i = 0; i < count; i++) {
			colors.push(Math.random(), Math.random(), Math.random());
		}
	} else {
		for (let i = 0; i < count; i++) {
			for (let j = 0; j < color.length; j++) {
				colors.push(color[j]);
			}
		}
	}
	return colors;
};

/**
 * Generate normals for sphere
 * @param  {Vec3D} pos      position of the center
 * @param  {Array} vertices array of vertices
 * @return {Array}          array with normals
 */
Utils.Sphere.prototype.createNormals = function(pos, vertices) {
	let normals = [];
	let pom = [];
	for (let i = 0; i < vertices.length; i+=3) {
		pom = Utils.convert(
			new Vec3D(vertices[i]-pos.x, vertices[i+1]-pos.y, vertices[i+2]-pos.z).normalized()
		);
		normals.push(pom[0], pom[1], pom[2]);
	}
	return normals;
};

/**
 * Generate texture coordinates for sphere
 * @param  {number} precision number of steps
 * @return {Array}         	  array with texture coordinates
 */
Utils.Sphere.prototype.createTextureCoords = function(precision) {
	let texCoords = [];
	//precision == 4
	let n = 1/(precision*2);//0.125
	let n2 = n*2;//0.25
	for (let i = 0; i <= precision; i++) {
		//0, 0.5, 0, 0.25, 0, 0,
		//0.125, 0.5, 0.125, 0.25, 0.125, 0,
		//0.25, 0.5, 0.25, 0.25, 0.25, 0,
		//0.375, 0.5, 0.375, 0.25, 0.375, 0,
		//0.5, 0.5, 0.5, 0.25, 0.5, 0,
		for (let j = 0; j < precision/2+1; j++) {
			texCoords.push(n*i, 0.5-j*n2);
		}
		//0.5, 0.25, 0.5, 0.5, 0.5, 0.75, 0.5, 1,
		//0.625, 0.25, 0.625, 0.5, 0.625, 0.75, 0.625, 1,
		//0.75, 0.25, 0.75, 0.5, 0.75, 0.75, 0.75, 1,
		//0.875, 0.25, 0.875, 0.5, 0.875, 0.75, 0.875, 1,
		//1, 0.25, 1, 0.5, 1, 0.75, 1, 1,
		for (let j = 0; j < precision; j++) {
			texCoords.push(0.5+n*i, (j+1)*n2);
		}
		//0, 0.75,
		//0.125, 0.75,
		//0.25, 0.75,
		//0.375, 0.75,
		//0.5, 0.75
		for (let j = 0; j < precision/2-1; j++) {
			texCoords.push(n*i, 1-(j+1)*n2);
		}
	}
	return texCoords;
};

/**
 * Generate indices for sphere
 * @param  {number} precision number of steps
 * @param  {boolean} strip    if true then triangle strip, regular triangle otherwise
 * @return {Array}            array with indices
 */
Utils.Sphere.prototype.createIndices = function(precision, strip) {
	let n = precision*2;
	let n2 = precision;
	let indices = [];
	let i, j, p, b;
	if (strip) {
		indices.push(n);
		for (i = 0; i < n2; i++) {
			p = i*n;
			if (i !== 0) {
				indices.push(p, p);
			}
			// from start to top
			for (j = 0; j < n/4; j++) {
				indices.push(j+n+p, j+p);
			}
			// from top down
			for (j = n/4; j <= 3*n/4; j++) {
				indices.push(j+p, j+n+p);
			}
			// from down to zero
			for (j = 3*n/4; j < n; j++) {
				indices.push(j+n+p, j+p);
			}
			// close to zero
			indices.push(n+p, p);
		}

		b = n*(n2-1);
		indices.push(b,b);// preparation for strip continuation
	}
	// regular triangles not strip
	else {
		// examples for
			// n == 12
			// precision == n2 == 6
			// b == 60
		for (i = 0; i < n/2; i++) {
			// from start to top
			//0, 12, 1, 1, 12, 13, /**/ 1, 13, 2, 2, 13, 14, /**/ 2, 14, 3, (3, 14, 15) /**/
			p = i*n;
			for (j = 0; j < n/4; j++) {
				indices.push(j+p, j+n+p, j+1+p, j+1+p, j+n+p, j+n+1+p);
			}
			// from top down
			//4, 16, 3, (3, 16, 15) /**/ 5, 17, 4, 4, 17, 16, /**/ 6, 18, 5, 5, 18, 17 ...
			for (j = n/4; j < 3*n/4; j++) {
				//indices.push(j+p, j+1+p, j+n+p, j+n+p, j+1+p);
				indices.push(j+1+p, j+n+1+p, j+p, j+p, j+n+1+p, j+n+p);
			}
			// from down to zero
			//(9, 21, 10,) 10, 21, 22, /**/ 10, 22, 11, 11, 22, 23
			for (j = 3*n/4; j < n-1; j++) {
				indices.push(j+p, j+n+p, j+1+p, j+1+p, j+n+p, j+n+1+p);
			}
			// close to zero
			//11, 23, 0, 0, 23, 12
			indices.push(n-1+p, n*2-1+p, p, p, n*2-1+p, n+p);
		}
	}
	return indices;
};

/**
 * Function for loading data from JSON file with AJAX
 * @param  {string}   url      address of file
 * @param  {Function} callback function to call after loading is complete; called with received data
 */
Utils.getDataFromJSON = function(url, callback) {
	var _404 = false,
		unknown_error = false,
		http_request = new XMLHttpRequest();
	http_request.open("GET", url, true);
	http_request.onreadystatechange = function() {
		// http_request.readyState
		// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
			// 0	UNSENT open() has not been called yet.
			// 1	OPENED send() has not been called yet.
			// 2	HEADERS_RECEIVED send() has been called, and headers and status are available.
			// 3	LOADING Downloading; responseText holds partial data.
			// 4	DONE The operation is complete.
		if (http_request.readyState === 4 && http_request.status === 200) {
			callback(JSON.parse(http_request.responseText));
		} else if (http_request.status === 404) {
			if (!_404) window.alert("File \""+url+"\" was not found (404)!");
			_404 = true;
		} else if (http_request.status !== 200 && http_request.status !== 404) {
			if (!unknown_error) window.alert("An error occured when laoding file \""+url+"\"!");
			unknown_error = true;
		}
	};
	http_request.send(null);
};

/**
 * Replacing Czech decimal comma with decimal point making it a number
 * @param  {String} number input from a form
 * @return {number}        number
 */
Utils.replaceComma = function(number) {
	return number.replace(",", ".") * 1;
};

/**
 * Helper function for loading textures
 * @param  {WebGLRenderingContext} gl WebGL context
 * @param  {Array} urls               array with URLs of textures to load
 * @param  {Function} callback        function to call after loading of all textures is complete, gets array with textures
 */
Utils.loadTexture = function(gl, urls, callback) {
	let result = [];
	let total = urls.length;
	let loaded = 0;

	let onload = function() {
		window.console.log("Texture \""+this.src+"\" loaded.");
		loaded++;
	};

	for (let i = 0; i < urls.length; i++) {

		result[i] = gl.createTexture();
		result[i].image = new Image();
		result[i].image.crossOrigin = "anonymous";

		result[i].image.onload = onload;
		result[i].image.src = urls[i];
	}

	// once in 50 ms check if all textures were already loaded
	let interval = function() {
		if (loaded < total) {
			setTimeout(interval, 50);
		} else {
			callback(result);
		}
	};
	setTimeout(interval, 1);
};

/**
 * Preparation for switching to full screen
 * @see More info in specification: {@link https://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html}
 * @param  {HTMLElement} element      element which is going to be on full screen
 * @param  {Function} startFullscreen function to call when full screen entered
 * @param  {Function} exitFullscreen  function to call when full screen exited
 */
Utils.initFullscreen = function(element, startFullscreen, exitFullscreen) {
	let oldW = element.width;
	let oldH = element.height;

	// what to do when something's changed
	function fullscreenChange() {
		if (document.fullscreenElement === element || document.webkitFullscreenElement === element || document.mozFullscreenElement === element) {

			element.width = screen.width;
			element.height = screen.height;

			startFullscreen();

		} else {
			element.width = oldW;
			element.height = oldH;

			exitFullscreen();
		}
	}
	document.addEventListener("fullscreenchange", fullscreenChange, false);
	document.addEventListener("mozfullscreenchange", fullscreenChange, false);
	document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
	//http://msdn.microsoft.com/en-us/library/ie/dn265028(v=vs.85).aspx

	element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.webkitRequestFullscreen;
};

/**
 * Preparation cursor locking on given element
 * @see {@link https://developer.mozilla.org/en-US/docs/WebAPI/Pointer_Lock}
 * @param  {HTMLElement} element      element, which is going to have locked cursor
 * @param  {Function} startFullscreen function to call on successful locking cursor
 * @param  {Function} exitFullscreen  function to call when cursor has been unlocked
 */
Utils.initPointerLock = function(element, startPointerLock, exitPointerLock) {
	// Edge 13+, FF 41+, Chrome 37+, Opera 24+, Safari ne

	function pointerLockChange() {
		if (document.pointerLockElement === element) {
			startPointerLock();
		} else {
			exitPointerLock();
		}
	}

	document.addEventListener("pointerlockchange", pointerLockChange, false);

	function pointerLockError() {
		window.console.log("Pointer lock failed.");
	}

	document.addEventListener("pointerlockerror", pointerLockError, false);
};

/**
 * Object for drawing axis
 * @type {Object}
 */
Utils.Axis = {};

/**
 * Initialization of program, shaders and buffers
 * @param  {WebGLRenderingContext} gl WebGL context
 */
Utils.Axis.init = function(gl) {
	this.axisProgram = gl.createProgram();

	let vs = gl.createShader(gl.VERTEX_SHADER);
	let v = "attribute vec3 axisPosition;"+
		"attribute vec3 axisColor;"+
		""+
		"uniform mat4 axisProjection;"+
		"uniform mat4 axisModelView;"+
		""+
		"varying vec4 vColor;"+
		""+
		"void main(void) {"+
		"	gl_Position = axisProjection * axisModelView * vec4(axisPosition, 1.0);"+
		"	vColor = vec4(axisColor, 1.0);"+
		"}";
	gl.shaderSource(vs, v);
	gl.compileShader(vs);
	gl.attachShader(this.axisProgram, vs);

	let fs = gl.createShader(gl.FRAGMENT_SHADER);
	let f = "precision mediump float;"+
		""+
		"varying vec4 vColor;"+
		""+
		"void main(void) {"+
		"		gl_FragColor = vColor;"+
		"}";
	gl.shaderSource(fs, f);
	gl.compileShader(fs);
	gl.attachShader(this.axisProgram, fs);

	gl.linkProgram(this.axisProgram);
	gl.useProgram(this.axisProgram);

	this.axisProgram.axisPosition = gl.getAttribLocation(this.axisProgram, "axisPosition");
	gl.enableVertexAttribArray(this.axisProgram.axisPosition);

	this.axisProgram.axisColor = gl.getAttribLocation(this.axisProgram, "axisColor");
	gl.enableVertexAttribArray(this.axisProgram.axisColor);

	this.axisProgram.axisProjection = gl.getUniformLocation(this.axisProgram, "axisProjection");
	this.axisProgram.axisModelView = gl.getUniformLocation(this.axisProgram, "axisModelView");

	this.dataBuffer = gl.createBuffer();
	let data = [
		0, 0, 0,  1, 0, 0,
		4, 0, 0,  1, 0, 0,
		0, 0, 0,  0, 1, 0,
		0, 4, 0,  0, 1, 0,
		0, 0, 0,  0, 0, 1,
		0, 0, 4,  0, 0, 1,
	];
	gl.bindBuffer(gl.ARRAY_BUFFER, this.dataBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	this.dataBuffer.itemSize = 6;

	this.step = Float32Array.BYTES_PER_ELEMENT;//4
	this.stride = this.dataBuffer.itemSize*this.step;//(3+3)*step
};

/**
 * Draw axis, has to be called after initialization
 * @param  {WebGLRenderingContext} gl WebGL context
 * @param  {Float32Array} modelview   array of 16 items (originally 4x4 matrix)
 * @param  {Float32Array} projection  array of 16 items (originally 4x4 matrix)
 */
Utils.Axis.draw = function(gl, modelview, projection) {
	gl.useProgram(this.axisProgram);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.dataBuffer);
	gl.vertexAttribPointer(this.axisProgram.axisPosition, 3, gl.FLOAT, false, this.stride, 0);
	gl.vertexAttribPointer(this.axisProgram.axisColor, 3, gl.FLOAT, false, this.stride, this.step*3);

	gl.uniformMatrix4fv(this.axisProgram.axisProjection, false, projection);
	gl.uniformMatrix4fv(this.axisProgram.axisModelView, false, modelview);

	gl.drawArrays(gl.LINES, 0, 6);
};
