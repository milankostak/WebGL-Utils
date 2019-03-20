"use strict";
/**
 * Utils je soubor často použivaných funkcí pro využití ve WebGL. Vyvinuto během roků 2013 a 2014.
 * @type {Object}
 * @version 1.0
 * @author Milan Košťák
 * @requires pro svou práci vyžaduje soubor transforms3d.js
 */
var Utils = {};

/**
 * Inicializace WebGL
 * @param  {HTMLCanvasElement} canvas
 * @param  {Array} args volitelný argument obsahující argumenty pro inicializaci WebGL
 * @return {WebGLRenderingContext}
 */
Utils.initWebGL = function(canvas, args) {
	var gl;
	try {
		gl = canvas.getContext("experimental-webgl", args);
	}
	catch(e) {}
	if (!gl) {
		alert("Nepodařilo se inicializovat WebGL. Váš prohlížeč ho pravděpodobně nepodporuje.");
		return false;
	}
	return gl;
};

/**
 * Inicializace překreslovací smyčky
 * @param  {number} fps počet snímků za vteřinu, pokud není vyplněno,
 *                      tak se uskuteční pokus o inicializaci requestAnimationFrame
 */
Utils.initRequestAnimationFrame = function(fps) {
	if (typeof fps == "number") {
		window.requestAnimFrame = function(callback) {
			window.setTimeout(callback, 1000/fps);
		};
	} else {
		window.requestAnimFrame = (function(callback) {
			return window.requestAnimationFrame || //plné implementace; Chrome 24+, FF 23+, Opera 15+, IE 10+
				window.webkitRequestAnimationFrame || //Chrome 10-23
				window.mozRequestAnimationFrame || // FF 4-22
				function(callback) {
					window.setTimeout(callback, 1000/60); //zbytek
				};
		})();
	}
};

/**
 * Funkce pro inicializaci shaderů
 * @param  {WebGLRenderingContext} gl
 * @param  {WebGLProgram} program
 * @param  {string} vsId id elementu s vertex shaderem
 * @param  {string} fsId id elementu s fragment shaderem
 * @return {boolean} vrací true, pokud kompilace proběhla úspěšně, jinak vyhazuje výjimku
 * @throws {SyntaxError} If kompilace neproběhla správně nebo shadery nebyly nalezeny
 */
Utils.initShaders = function(gl, program, vsId, fsId) {
	function initShader(id, type){
		var shader = gl.createShader(type);
		var value;
		try {
			value = document.getElementById(id).firstChild.nodeValue;
		} catch (e) {
			var x = "Utils.initShaders: ";
			x += (type == gl.VERTEX_SHADER) ? "Vertex" : "Fragment";
			x += " shader nebyl nalezen!";
			alert(x);
			throw new Error(x);
		}
		gl.shaderSource(shader, value);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			var x = (type == gl.VERTEX_SHADER) ? "Vertex shader error\n" : "Fragment shader error\n";
			x += gl.getShaderInfoLog(shader);
			alert(x);
			console.log(x);
			return false;
		} else {
			gl.attachShader(program, shader);
			return true;
		}
	}
	//zkontrolovat fs, i kdyby vs nebyl v pořádku
	var result = (initShader(vsId, gl.VERTEX_SHADER)) & (initShader(fsId, gl.FRAGMENT_SHADER));
	if (!result) {
		throw new SyntaxError("Shader syntax error.");
	} else {
		return true;
	}
};

/**
 * Vrací počet pixelů posunu myši
 * @param  {MouseEvent} e
 * @return {Object} objekt s vlastnostmi x a y vyjadřujících posun myši
 */
Utils.getMousePoint = function(e) {
	e = e || window.event;
	var point = {};
	//Opera 12 neumí e.layerX
	//FF neumí e.offsetX
	//Opera 15+ (asi chrome) umí špatně e.layerX
	//IE 11 umí všechny a dobře
	point.x = e.offsetX || e.clientX - e.target.offsetLeft || 0;
	point.y = e.offsetY || e.clientY - e.target.offsetTop || 0;
	return point;
};

/**
 * Vrací počet pixelů posunu myši
 * Využití při pointer lock
 * @param  {MouseEvent} e
 * @return {Object} objekt s vlastnostmi x a y vyjadřujících posun myši
 */
Utils.getLockedMousePoint = function(e) {
	var point = {};
	point.x = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
	point.y = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
	return point;
};

/**
 * Vrací počet kroků provedných kolečkem myši
 * @param  {MouseEvent} e
 * @return {number}
 */
Utils.getWheelRotation = function(e) {
	//FF neumí e.wheelDelta
	return e.wheelDelta || e.detail;
};

/**
 * Zapouzdření metody pro přidání listeneru pro kolečko myši
 * @param {HTMLElement} element
 * @param {Function} callback
 */
Utils.addMouseWheelListener = function(element, callback) {
	//FF neumí onmousewheel
	if ("onmousewheel" in document) {
		element.onmousewheel = callback;
	} else {
		element.addEventListener("DOMMouseScroll", callback, false);
	}
};

/**
 * Výpočet vzdálenosti dvou bodů v rovině
 * @param  {number} x
 * @param  {number} y
 * @param  {number} x2
 * @param  {number} y2
 * @return {number} vzdálenost
 */
Utils.distance = function(x, y, x2, y2){
	return Math.sqrt(Math.pow((y2-y),2) + Math.pow((x2-x),2));
};

/**
 * Funkce pro převedení matic a vektorů na Float32Array
 * @param  {various} a
 * @return {Float32Array}
 */
Utils.convert = function(a) {
	var i, j, temp;
	if (a instanceof Vec1D) {
		return new Float32Array([a.x]);
	} else if (a instanceof Vec2D) {
		return new Float32Array([a.x, a.y]);
	} else if (a instanceof Vec3D) {
		return new Float32Array([a.x, a.y, a.z]);
	} else if (a instanceof Point3D) {
		return new Float32Array([a.x, a.y, a.z, a.w]);
	} else if (a instanceof Mat3) {
		temp = new Float32Array(9);
		for (i = 0; i < 3; i++) {
			for (j = 0; j < 3; j++) {
				temp[i*3+j] = a.mat[i][j];
			}
		}
		return temp;
	} else if (a instanceof Mat4) {
		temp = new Float32Array(16);
		for (i = 0; i < 4; i++) {
			for (j = 0; j < 4; j++) {
				temp[i*4+j] = a.mat[i][j];
			}
		}
		return temp;
	}
};

/**
 * Objekt pro práci se scénou
 * Umožňuje vygenerovat vrcholy, normály, barvy a indexy některých základních těles
 */
Utils.Scene = function() {
	this.vertices = [];
	this.colors = [];
	this.textureCoords = [];
	this.normals = [];
	this.indices = [];
};

/**
 * Přidání bloku do scény
 * @param {various} a objekt pro přidání - Block, Face, Sphere
 */
Utils.Scene.prototype.add = function(a) {
	var length = this.vertices.length/3;
	this.vertices = this.vertices.concat(a.vertices);
	this.colors = this.colors.concat(a.colors);
	this.textureCoords = this.textureCoords.concat(a.textureCoords);
	this.normals = this.normals.concat(a.normals);
	var b = a.indices;

	for (var i = 0; i < b.length; i++) {
		b[i] = b[i]+length;
	}
	this.indices = this.indices.concat(b);
};

/**
 * Vytvoření kvádru
 * @param {number} a     délky strany a
 * @param {number} b     délky strany b
 * @param {number} c     délky strany c
 * @param {number} posx  pozice středu
 * @param {number} posy  pozice středu
 * @param {number} posz  pozice středu
 * @param {Object} args  dodatečné argumenty
 *                       color - Array - barva jako třísložkové pole, pokud undefined, tak rgb krychle (kvádr)
 *                       sharedVertices - boolean - zda mají být pro každou stěnu vygenerovány vlastní vrcholy (false),
 *                       							nebo zda je možné vrcholy sdílet (true, výchozí hodnota)
 *                       							pokud jsou vrcholy sdílené, tak není nejsou vygenerovány normály a souřadnice do textury
 */
Utils.Block = function(a, b, c, posx, posy, posz, args) {
	if (args === undefined) args = {};
	if (args.sharedVertices === undefined) args.sharedVertices = true;

	this.vertices = this.createVertices(a, b, c, posx, posy, posz, args.sharedVertices);
	this.colors = this.createColors(args.color);
	this.textureCoords = [];
	this.normals = [];
	this.indices = [
		//front
		0, 1, 2,	1, 3, 2,
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
};

/**
 * Vygenerování vrcholů pro kvádr
 * @param  {number} a délka strany
 * @param  {number} b délka strany
 * @param  {number} c délka strany
 * @param  {number} x souřadnice středu
 * @param  {number} y souřadnice středu
 * @param  {number} z souřadnice středu
 * @param  {boolean} shared zda mají být sdílené vektory, více info v konstruktoru objektu
 * @return {Array}    pole s vrcholy
 */
Utils.Block.prototype.createVertices = function(a, b, c, x, y, z, shared) {
	var vertices = [];
	if (shared) {
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
	} else {
		//front face
		//bottom, left
		vertices.push(-a+x, -b+y, c+z);
		//bottom, right
		vertices.push(a+x, -b+y, c+z);
		//top, left
		vertices.push(-a+x, b+y, c+z);
		//top right
		vertices.push(a+x, b+y, c+z);

		//right face
		vertices.push(a+x, b+y, c+z);
		vertices.push(a+x, b+y, c+z);
		vertices.push(a+x, b+y, c+z);
		vertices.push(a+x, b+y, c+z);
			-1.0, -1.0, -1.0,
			-1.0,  1.0, -1.0,
			 1.0,  1.0, -1.0,
			 1.0, -1.0, -1.0,

			-1.0,  1.0, -1.0,
			-1.0,  1.0,  1.0,
			 1.0,  1.0,  1.0,
			 1.0,  1.0, -1.0,
			-1.0, -1.0, -1.0,

			 1.0, -1.0, -1.0,
			 1.0, -1.0,	 1.0,
			-1.0, -1.0,	 1.0,
			 1.0, -1.0, -1.0,
			 1.0,  1.0, -1.0,
			 1.0,  1.0,  1.0,
			 1.0, -1.0,  1.0,
			-1.0, -1.0, -1.0,
			-1.0, -1.0,  1.0,
			-1.0,  1.0,  1.0,
			-1.0,  1.0, -1.0
	}
	return vertices;
};

/**
 * Vygenerování barev pro kvádr
 * @param  {Array} color barva jako libovolně velké pole,
 *                       pokud je undefined, tak bude vygenerována rgb krychle (kvádr)
 * @return {Array}       pole s barvami
 */
Utils.Block.prototype.createColors = function(color) {
	var colors = [];
	if (color !== undefined) {
		if (color.length == 3) {
			var r = color[0], g = color[1], b = color[2];
			colors.push(r, g, b, r, g, b, r, g, b, r, g, b, r, g, b, r, g, b, r, g, b, r, g, b);
		} else {
			for (var i = 0; i < 8; i++) {
				for (var j = 0; j < color.length; j++) {
					colors.push(color[j]);
				}
			}
		}
	} else {
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
	}
	return colors;
};

/**
 * Vyvtoření stěny
 * @param {number} a     délky strany
 * @param {number} b     délky strany
 * @param {number} x     souřadnice středu
 * @param {number} y     souřadnice středu
 * @param {number} z     souřadnice středu
 * @param {Object} args  dodatečné argumenty
 *                       color - Array - barva, pokud undefined, tak bílá barva
 *                       strip - boolean - zda má být index buffer pro triangle strip
 */
Utils.Face = function(a, b, x, y, z, args) {
	if (args === undefined) args = {};
	if (args.color === undefined) args.color = [1, 1, 1];
	if (args.strip === undefined) args.strip = true;

	this.vertices = this.createVertices(a, b, x, y, z);
	this.colors = this.createColors(args.color);
	this.textureCoords = [];
	this.normals = this.createNormals(new Vec3D(x, y, z), this.vertices);
	this.indices = this.createIndices(args.strip);
};

/**
 * Vygenerování vrcholů pro stěnu
 * @param  {number} a délka strany
 * @param  {number} b délka strany
 * @param  {number} x souřadnice středu
 * @param  {number} y souřadnice středu
 * @param  {number} z souřadnice středu
 * @return {Array}   pole s vrcholy
 */
Utils.Face.prototype.createVertices = function(a, b, x, y, z) {
	var vertices = [];
	//bottom, left
	vertices.push(-a+x, -b+y, z);
	//bottom, right
	vertices.push(a+x, -b+y, z);
	//top, left
	vertices.push(-a+x, b+y, z);
	//top, right
	vertices.push(a+x, b+y, z);
	return vertices;
};

/**
 * Vygenerování barev
 * @param  {number} color barva jako libovolně velké pole, může být undefined
 * @return {Array}        pole s barvami
 */
Utils.Face.prototype.createColors = function(color) {
	var colors = [];
	if (color !== undefined) {
		if (color.length == 3) {
			var r = color[0], g = color[1], b = color[2];
			colors.push(r, g, b, r, g, b, r, g, b, r, g, b);
		} else {
			for (var i = 0; i < 8; i++) {
				for (var j = 0; j < color.length; j++) {
					colors.push(color[j]);
				}
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
 * Vygenerování normál pro stěnu
 * @param  {Vec3D} pos      pozice středu
 * @param  {Array} vertices vertex buffer
 * @return {Array}          pole s normálami
 */
Utils.Face.prototype.createNormals = function(pos, vertices) {
	var normals = [];
	var pom = [];
	for (var i = 0; i < vertices.length; i+=3) {
		pom = Utils.convert( new Vec3D(vertices[i]-pos.x,vertices[i+1]-pos.y,vertices[i+2]-pos.z).normalized() );
		normals.push(pom[0], pom[1], pom[2]);
	}
	return normals;
};

/**
 * Vytvoření index bufferu pro stěnu
 * @param  {boolean} strip
 * @return {Array}         index buffer
 */
Utils.Face.prototype.createIndices = function(strip) {
	if (strip) {
		return [0, 0, 1, 2, 3, 3];
	} else {
		return [0, 1, 2,	1, 3, 2];
	}

};

/**
 * Vytvoření koule
 * @param {number} posx      souřadnice středu
 * @param {number} posy      souřadnice středu
 * @param {number} posz      souřadnice středu
 * @param {number} radius    poloměr
 * @param {number} precision počet kroků přes rovník a poledník, nemůže být rozdílné, výrazně ovlivňuje výsledný počet vrcholů
 *                           funguje pouze pro sudé hodnoty
 *                           pokud rovno 2, tak vznikne pravidelný osmistěn
 * @param {Object} args      dodatečné argumenty
 *                          color - Array - barva, pokud undefined, tak bílá barva
 *                          strip - boolean - zda má být index buffer pro triangle strip
 *                          randomColor - boolean - pokud true, tak vygeneruje barvy náhodně
 */
Utils.Sphere = function(posx, posy, posz, radius, precision, args) {
	if (args === undefined) args = {};
	if (args.color === undefined) args.color = [1, 1, 1];
	if (args.strip === undefined) args.strip = true;
	if (args.randomColor === undefined) args.randomColor = false;

	var pos = new Vec3D(posx, posy, posz);
	this.vertices = this.createVertices(pos, radius, precision);
	this.colors = this.createColors(this.vertices.length/3, args.color, args.randomColor);
	this.normals = this.createNormals(pos, this.vertices);
	this.textureCoords = this.createTextureCoords(precision);
	this.indices = this.createIndices(precision, args.strip);
};

/**
 * Vygenerování vrcholů pro kouli
 * @param  {Vec3D} pos        pozice středu
 * @param  {number} radius    poloměr
 * @param  {number} precision úroveň přesnosti
 * @return {Array}            pole s vrcholy
 */
Utils.Sphere.prototype.createVertices = function(pos, radius, precision) {
	//var PI2 = 2*Math.PI;
	//var PI = Math.PI;
	var step = Math.PI/precision;
	var vertices = [];
	var x, y, z;
	for (var fi = 0, round1 = 0; round1 <= precision; fi+=step, round1++) {
		x = pos.x+radius*Math.cos(fi);//Math.cos(0) == 1
		y = pos.y+radius*Math.sin(fi);//Math.cos(0) == 1
		z = pos.z;//+radius*Math.sin(0) -> +0
		vertices.push(x, y, z);
		for (var psi = step, round2 = 1; round2 < 2*precision; psi+=step, round2++) {
			x = pos.x+radius*Math.cos(fi)*Math.cos(psi);
			y = pos.y+radius*Math.sin(fi)*Math.cos(psi);
			z = pos.z+radius*Math.sin(psi);
			vertices.push(x, y, z);
		}
	}
	return vertices;
};

/**
 * Vygenerování barev
 * @param  {number} count   počet, vychází z počtu vrcholů
 * @param  {Array} color    pole s barvou; ignorováno pokud (random == true)
 * @param  {boolean} random zda mají být vygenerovány náhodné barvy
 * @return {Array}          pole s barvami
 */
Utils.Sphere.prototype.createColors = function(count, color, random) {
	var colors = [];
	var i;
	if (random) {
		for (i = 0; i < count; i++) {
			colors.push(Math.random(), Math.random(), Math.random());
		}
	} else if (color.length == 3) {
		var r = color[0], g = color[1], b = color[2];
		for (i = 0; i < count; i++) {
			colors.push(r, g, b);
		}
	} else {
		for (i = 0; i < count; i++) {
			for (var j = 0; j < color.length; j++) {
				colors.push(color[j]);
			}
		}
	}

	return colors;
};

/**
 * Vygenerování normál pro kouli
 * @param  {Vec3D} pos      pozice středu
 * @param  {Array} vertices vertex buffer
 * @return {Array}          pole s normálami
 */
Utils.Sphere.prototype.createNormals = function(pos, vertices) {
	var normals = [];
	var pom = [];
	for (var i = 0; i < vertices.length; i+=3) {
		pom = Utils.convert( new Vec3D(vertices[i]-pos.x,vertices[i+1]-pos.y,vertices[i+2]-pos.z).normalized() );
		normals.push(pom[0], pom[1], pom[2]);
	}
	return normals;
};

/**
 * Vygenerování souřadnic do textury pro kouli
 * @param  {number} precision
 * @return {Array}         	  pole se souřadnicemi
 */
Utils.Sphere.prototype.createTextureCoords = function(precision) {
	var texCoords = [];
	//precision == 4
	var n = 1/(precision*2);//0.125
	var n2 = n*2;//0.25
	for (var i = 0; i <= precision; i++) {
		var j;
		//0, 0.5, 0, 0.25, 0, 0,
		//0.125, 0.5, 0.125, 0.25, 0.125, 0,
		//0.25, 0.5, 0.25, 0.25, 0.25, 0,
		//0.375, 0.5, 0.375, 0.25, 0.375, 0,
		//0.5, 0.5, 0.5, 0.25, 0.5, 0,
		for (j = 0; j < precision/2+1; j++) {
			texCoords.push(n*i, 0.5-j*n2);
		}
		//0.5, 0.25, 0.5, 0.5, 0.5, 0.75, 0.5, 1,
		//0.625, 0.25, 0.625, 0.5, 0.625, 0.75, 0.625, 1,
		//0.75, 0.25, 0.75, 0.5, 0.75, 0.75, 0.75, 1,
		//0.875, 0.25, 0.875, 0.5, 0.875, 0.75, 0.875, 1,
		//1, 0.25, 1, 0.5, 1, 0.75, 1, 1,
		for (j = 0; j < precision; j++) {
			texCoords.push(0.5+n*i, (j+1)*n2);
		}
		//0, 0.75,    
		//0.125, 0.75,
		//0.25, 0.75, 
		//0.375, 0.75,
		//0.5, 0.75   
		for (j = 0; j < precision/2-1; j++) {
			texCoords.push(n*i, 1-(j+1)*n2);
		}
	}
	return texCoords;
};

/**
 * Vytvoření indexů pro kouli
 * @param  {number} precision
 * @param  {boolean} strip    pokud true, tak triangle strip, jinak obyčejný triangle
 * @return {Array}            pole s indexy
 */
Utils.Sphere.prototype.createIndices = function(precision, strip) {
	var n = precision*2;
	var n2 = precision;
	var indices = [];
	var i, j, p, b;
	if (strip) {
		indices.push(n);
		for (i = 0; i < n2; i++) {
			p = i*n;
			if (i !== 0) {
				indices.push(p, p);
			}
			//od počátku nahoru
			for (j = 0; j < n/4; j++) {
				indices.push(j+n+p, j+p);
			}
			//od shora dolu
			for (j = n/4; j <= 3*n/4; j++) {
				indices.push(j+p, j+n+p);
			}
			//od zdola do nuly
			for (j = 3*n/4; j < n; j++) {
				indices.push(j+n+p, j+p);
			}
			//uzavřít do nuly
			indices.push(n+p, p);
		}
		 
		b = n*(n2-1);
		indices.push(b,b);//příprava na pokračování stripu
	}
	//obyčejné trojúhelníky, ne strip
	else {
		//příklady pro 
			// n == 12
			// precision == n2 == 6
			// b == 60
		for (i = 0; i < n/2; i++) {
			//od počátku nahoru
			//0, 12, 1, 1, 12, 13, /**/ 1, 13, 2, 2, 13, 14, /**/ 2, 14, 3, (3, 14, 15) /**/
			p = i*n;
			for (j = 0; j < n/4; j++) {
				indices.push(j+p, j+n+p, j+1+p, j+1+p, j+n+p, j+n+1+p);
			}
			//od shora dolu
			//4, 16, 3, (3, 16, 15) /**/ 5, 17, 4, 4, 17, 16, /**/ 6, 18, 5, 5, 18, 17 ...
			for (j = n/4; j < 3*n/4; j++) {
				//indices.push(j+p, j+1+p, j+n+p, j+n+p, j+1+p);
				indices.push(j+1+p, j+n+1+p, j+p, j+p, j+n+1+p, j+n+p);
			}
			//od zdola do nuly
			//(9, 21, 10,) 10, 21, 22, /**/ 10, 22, 11, 11, 22, 23 
			for (j = 3*n/4; j < n-1; j++) {
				indices.push(j+p, j+n+p, j+1+p, j+1+p, j+n+p, j+n+1+p);
			}
			//uzavřít do nuly
			//11, 23, 0, 0, 23, 12
			indices.push(n-1+p, n*2-1+p, p, p, n*2-1+p, n+p);
		}
	}
	return indices;
};

/**
 * Funkce pro načtení dat z JSON souboru
 * @param  {string}   url      adresa souboru
 * @param  {Function} callback funkce pro spuštění po načtení,
 *                             zavolá se s parametrem obsahujícím přijatá data
 */
Utils.getDataFromJSON = function(url, callback) {
	var _404 = false;
	var unknown_error = false;
	var http_request = new XMLHttpRequest();
	http_request.open("GET", url, true);
	http_request.onreadystatechange = function () {
		//http_request.readyState
		//https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
			//0	UNSENT	open() has not been called yet.
			//1	OPENED	send() has not been called yet.
			//2	HEADERS_RECEIVED	send() has been called, and headers and status are available.
			//3	LOADING	Downloading; responseText holds partial data.
			//4	DONE	The operation is complete.
		if (http_request.readyState == 4 && http_request.status == 200) {
			callback(JSON.parse(http_request.responseText));
		} else if (http_request.status == 404) {
			if (!_404) alert("Soubor \""+url+"\" nebyl nalezen!");
			_404 = true;
		} else if (http_request.status != 200 && http_request.status != 404) {
			if (!unknown_error) alert("Při načítání souboru \""+url+"\" se vyskytla neznámá chyba!");
			unknown_error = true;
		}
	};
	http_request.send(null);
};

/**
 * Nahrazení české destinné čárky desetinnou tečkou
 * @param  {String} number vstup z formuláře
 * @return {number}        číslo
 */
Utils.replaceComma = function(number) {
	return number.replace(",", ".")*1;
};

/**
 * Načtení textur
 * @param  {WebGLRenderingContext}   gl
 * @param  {Array}   url       seznam url
 * @param  {Function} callback funkce pro spuštění po dokončení načtení všech obrázků,
 *                             jako parametr je předáno pole s texturami
 */
Utils.loadTexture = function(gl, url, callback) {
	var result = [];
	var total = url.length;
	var loaded = 0;
	for (var i = 0; i < url.length; i++) {

		result[i] = gl.createTexture();
		result[i].image = new Image();
		//result[i].image.crossOrigin = "anonymouse";

		result[i].image.onload = function (e) {
			console.log("Texture \""+this.src+"\" loaded.");
			loaded++;
		};
		result[i].image.src = url[i];
	}

	var interval = function() {
		if (loaded < total) {
			setTimeout(interval, 50);
		} else {
			callback(result);
		}
	};
	setTimeout(interval, 1);

};

/**
 * Příprava pro přepnutí do režimu celé obrazovky
 * @see Více info ve specifikaci: {@link https://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html} 
 * @param  {HTMLElement} element      element, kde se přepne na celou obrazovku
 * @param  {Function} startFullscreen funkce pro spuštění při úspěšném přepnutí do celé obrazovky
 * @param  {Function} exitFullscreen  funkce pro spuštění při opuštení celé obrazovky
 */
Utils.initFullscreen = function(element, startFullscreen, exitFullscreen) {
	var oldW = element.width;
	var oldH = element.height;
	
	//co udělat při změně
	function fullscreenChange() {
		if (document.fullscreenElement === element || document.webkitFullscreenElement === element ||
				document.mozFullscreenElement === element || document.mozFullScreenElement === element ||
				document.msFullscreenElement === element) {

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
	document.addEventListener("MSFullscreenChange", fullscreenChange, false);
	//http://msdn.microsoft.com/en-us/library/ie/dn265028(v=vs.85).aspx

	element.requestFullscreen = element.requestFullscreen ||
								element.mozRequestFullscreen ||
								element.mozRequestFullScreen ||
								element.webkitRequestFullscreen ||
								element.msRequestFullscreen;
};

/**
 * Příprava pro uzamknutí kurzoru nad elementem
 * @see {@link https://developer.mozilla.org/en-US/docs/WebAPI/Pointer_Lock} 
 * @param  {HTMLElement} element      element, který "pohltí" kurzor
 * @param  {Function} startFullscreen funkce pro spuštění při úspěšném uzamknutí kurzoru
 * @param  {Function} exitFullscreen  funkce pro spuštění při odemknutí kurzoru
 */
Utils.initPointerLock = function(element, startPointerLock, exitPointerLock) {

	function pointerLockChange() {
		if (document.pointerLockElement === element ||
					document.mozPointerLockElement === element ||
					document.webkitPointerLockElement === element) {
				startPointerLock();
		} else {
				exitPointerLock();
		}
	}

	document.addEventListener("pointerlockchange", pointerLockChange, false);
	document.addEventListener("mozpointerlockchange", pointerLockChange, false);
	document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
	
	function pointerLockError() {
		console.log("Uzamčení kurzoru se nezdařilo.");
	}
	
	document.addEventListener("pointerlockerror", pointerLockError, false);
	document.addEventListener("mozpointerlockerror", pointerLockError, false);
	document.addEventListener("webkitpointerlockerror", pointerLockError, false);

	element.requestPointerLock = element.requestPointerLock	||
				element.mozRequestPointerLock ||
				element.webkitRequestPointerLock;
};

/**
 * Objekt pro práci s osami
 * @type {Object}
 */
Utils.Axis = {};

/**
 * Inicializace os
 * @param  {WebGLRenderingContext} gl
 */
Utils.Axis.init = function(gl) {
	this.axisProgram = gl.createProgram();
	
	var vs = gl.createShader(gl.VERTEX_SHADER);
	var v = "attribute vec3 axisPosition;"+
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
	
	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	var f = "precision mediump float;"+
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
	var data = [
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
 * Vykreslení os, nutné volat až po inicializaci
 * @param  {WebGLRenderingContext} gl
 * @param  {Float32Array} modelview  pole 16 prvků (původně 4x4 matice)
 * @param  {Float32Array} projection pole 16 prvků (původně 4x4 matice)
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
