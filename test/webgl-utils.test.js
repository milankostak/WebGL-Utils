"use strict"

describe("Utils.initWebGL", function() {
	let canvas = document.createElement("canvas");
	let gl = Utils.initWebGL(canvas, Utils.WebGL1, {antialias: true});

	let canvas2 = document.createElement("canvas");
	let gl2 = Utils.initWebGL(canvas2, Utils.WebGL2);

	it("returns object", function() {
		expect(typeof gl).toBe("object");
	});

	it("returns WebGL1 context", function() {
		expect(gl instanceof WebGLRenderingContext).toBe(true);
	});

	it("returns WebGL2 context", function() {
		expect(gl2 instanceof WebGL2RenderingContext).toBe(true);
	});

	it("args works", function() {
		let isAntialias = gl.getContextAttributes().antialias;
		expect(isAntialias).toBe(true);
	});
});

describe("Utils.initRequestAnimationFrame", function() {

	it("initialize requestAnimFrame to be function", function() {
		Utils.initRequestAnimationFrame();
		let raf = window.requestAnimFrame;
		expect(typeof raf).toBe("function");
	});

	it("with parameter uses setTimeout function", function() {
		Utils.initRequestAnimationFrame(40);
		let raf = window.requestAnimFrame;
		expect(raf.toString()).toContain("setTimeout");
	});
});

describe("Utils.getMousePoint", function() {
	let element = document.createElement("div");

	it("returns object with 'x' and 'y' properties and works for onmousedown", function() {

		element.onmousedown = function(e) {
			let point = Utils.getMousePoint(e);
			expect(point.x).toBe(3);
			expect(point.y).toBe(4);
		};

		let event = document.createEvent("MouseEvents");
		event.initMouseEvent(
			'mousedown', true, true,
			window,
			120,
			1, 2,
			3, 4,
			0, 0, 0, 0,
			0, null
		);
		element.dispatchEvent(event);
	});

	it("works for onmousemove", function() {

		element.onmousemove = function(e) {
			let point = Utils.getMousePoint(e);
			expect(point.x).toBe(3);
			expect(point.y).toBe(4);
		};

		let event = document.createEvent("MouseEvents");
		event.initMouseEvent(
			'mousemove', true, true,
			window,
			120,
			1, 2,
			3, 4,
			0, 0, 0, 0,
			0, null
		);
		element.dispatchEvent(event);
	});

	it("works for onmouseup", function() {

		element.onmouseup = function(e) {
			let point = Utils.getMousePoint(e);
			expect(point.x).toBe(3);
			expect(point.y).toBe(4);
		};

		let event = document.createEvent("MouseEvents");
		event.initMouseEvent(
			'mouseup', true, true,
			window,
			120,
			1, 2,
			3, 4,
			0, 0, 0, 0,
			0, null
		);
		element.dispatchEvent(event);
	});
});

describe("Utils.getWheelRotation", function() {
	let element = document.createElement("div");

	it("returns number of wheel steps correctly", function() {
		Utils.addMouseWheelListener(element, (e) => {
			expect(Utils.getWheelRotation(e)).toBe(120);
		});

		let event = document.createEvent("MouseEvents");
		event.initMouseEvent(
			'wheel',// in DOMString typeArg,
			true,	// in boolean canBubbleArg,
			true,	// in boolean cancelableArg,
			window,	// in views::AbstractView viewArg,
			120,	// in long detailArg,
			0,		// in long screenXArg,
			0,		// in long screenYArg,
			0,		// in long clientXArg,
			0,		// in long clientYArg,
			0,		// in boolean ctrlKeyArg,
			0,		// in boolean altKeyArg,
			0,		// in boolean shiftKeyArg,
			0,		// in boolean metaKeyArg,
			0,		// in unsigned short buttonArg,
			null	// in EventTarget relatedTargetArg
		);
		element.dispatchEvent(event);
	});
});

describe("Utils.addMouseWheelListener", function() {
	let element = document.createElement("div");

	it("correcly assigns the wheel listener", function() {
		Utils.addMouseWheelListener(element, (e) => {
			expect(e.type).toBe("wheel");
		});

		let event = new Event("wheel");
		element.dispatchEvent(event);
	});
});

describe("Utils.distance", function() {

	it("works for (1, 2, 3, 4)", function() {
		let d = Utils.distance(1, 2, 3, 4);
		expect(d).toBeCloseTo(2.8284271247461903, 5);
	});

	it("works for (4, 6, 2, 6)", function() {
		let d = Utils.distance(4, 6, 2, 6);
		expect(d).toBe(2);
	});
});

describe("Utils.convert", function() {

	it("converts Vec1D correctly", function() {
		let arr = Utils.convert(new Vec1D(5.3));
		expect(arr.length).toBe(1);
		expect(arr[0]).toBeCloseTo(5.3, 5);
	});

	it("converts Vec2D correctly", function() {
		let arr = Utils.convert(new Vec2D(1.2, -6.1));
		expect(arr.length).toBe(2);
		expect(arr[0]).toBeCloseTo(1.2, 5);
		expect(arr[1]).toBeCloseTo(-6.1, 5);
	});

	it("converts Vec3D correctly", function() {
		let arr = Utils.convert(new Vec3D(2.3, -5, 8.2));
		expect(arr.length).toBe(3);
		expect(arr[0]).toBeCloseTo(2.3, 5);
		expect(arr[1]).toBeCloseTo(-5, 5);
		expect(arr[2]).toBeCloseTo(8.2, 5);
	});

	it("converts Point3D correctly", function() {
		let arr = Utils.convert(new Point3D(0.1, 2.2, -7.9, 3.6));
		expect(arr.length).toBe(4);
		expect(arr[0]).toBeCloseTo(0.1, 5);
		expect(arr[1]).toBeCloseTo(2.2, 5);
		expect(arr[2]).toBeCloseTo(-7.9, 5);
		expect(arr[3]).toBeCloseTo(3.6, 5);
	});

	it("converts Mat3 correctly", function() {
		let a = new Vec3D(1.1, 2.2, 3.3);
		let b = new Vec3D(4.4, 5.5, 6.6);
		let c = new Vec3D(7.7, 8.8, 9.9);
		let arr = Utils.convert(new Mat3(a, b, c));
		expect(arr.length).toBe(9);
		expect(arr[0]).toBeCloseTo(1.1, 5);
		expect(arr[1]).toBeCloseTo(2.2, 5);
		expect(arr[2]).toBeCloseTo(3.3, 5);
		expect(arr[3]).toBeCloseTo(4.4, 5);
		expect(arr[4]).toBeCloseTo(5.5, 5);
		expect(arr[5]).toBeCloseTo(6.6, 5);
		expect(arr[6]).toBeCloseTo(7.7, 5);
		expect(arr[7]).toBeCloseTo(8.8, 5);
		expect(arr[8]).toBeCloseTo(9.9, 5);
	});

	it("converts Mat4 correctly", function() {
		let a = new Point3D(1.1, 2.2, 3.3, 4.4);
		let b = new Point3D(5.5, 6.6, 7.7, 8.8);
		let c = new Point3D(9.9, 10.10, 11.11, 12.12);
		let d = new Point3D(13.13, 14.14, 15.15, 16.16);
		let arr = Utils.convert(new Mat4(a, b, c, d));
		expect(arr.length).toBe(16);
		expect(arr[0]).toBeCloseTo(1.1, 5);
		expect(arr[1]).toBeCloseTo(2.2, 5);
		expect(arr[2]).toBeCloseTo(3.3, 5);
		expect(arr[3]).toBeCloseTo(4.4, 5);
		expect(arr[4]).toBeCloseTo(5.5, 5);
		expect(arr[5]).toBeCloseTo(6.6, 5);
		expect(arr[6]).toBeCloseTo(7.7, 5);
		expect(arr[7]).toBeCloseTo(8.8, 5);
		expect(arr[8]).toBeCloseTo(9.9, 5);
		expect(arr[9]).toBeCloseTo(10.10, 5);
		expect(arr[10]).toBeCloseTo(11.11, 5);
		expect(arr[11]).toBeCloseTo(12.12, 5);
		expect(arr[12]).toBeCloseTo(13.13, 5);
		expect(arr[13]).toBeCloseTo(14.14, 5);
		expect(arr[14]).toBeCloseTo(15.15, 5);
		expect(arr[15]).toBeCloseTo(16.16, 5);
	});
});

describe("Utils.Scene", function() {

	it("constructor works correctly", function() {
		let scene = new Utils.Scene();
		expect(scene.vertices instanceof Array).toBe(true);
		expect(scene.vertices.length).toBe(0);
		expect(scene.colors instanceof Array).toBe(true);
		expect(scene.colors.length).toBe(0);
		expect(scene.textureCoords instanceof Array).toBe(true);
		expect(scene.textureCoords.length).toBe(0);
		expect(scene.normals instanceof Array).toBe(true);
		expect(scene.normals.length).toBe(0);
		expect(scene.indices instanceof Array).toBe(true);
		expect(scene.indices.length).toBe(0);
	});

	it("add method returns Scene", function() {
		let scene = new Utils.Scene();
		let a = new Utils.Block(1, 2, 3, 4, 5, 6);
		let b = new Utils.Face(1, 2, 4, 5, 6);
		expect(scene.add(a).add(b) instanceof Utils.Scene).toBe(true);
	});

	it("correctly adds object to scene", function() {
		let scene = new Utils.Scene();
		let a = new Utils.Block(1, 2, 3, 4, 5, 6, {sharedVertices: false});
		let b = new Utils.Face(1, 2, 4, 5, 6, {strip: false});
		scene.add(a).add(b);

		expect(scene.vertices.length).toBe(84);
		expect(scene.vertices[49]).toBe(3);
		expect(scene.vertices[58]).toBe(7);

		expect(scene.colors.length).toBe(84);
		expect(scene.colors[50]).toBe(0.2);
		expect(scene.colors[60]).toBe(1);

		expect(scene.textureCoords.length).toBe(56);
		expect(scene.textureCoords[10]).toBe(1);
		expect(scene.textureCoords[11]).toBe(0);

		expect(scene.normals.length).toBe(12);
		expect(scene.normals[6]).toBeCloseTo(-0.4472135901451111, 5);
		expect(scene.normals[8]).toBeCloseTo(0, 5);

		expect(scene.indices.length).toBe(42);
		expect(scene.indices[10]).toBe(7);
		expect(scene.indices[41]).toBe(26);
	});
});

describe("Utils.Block", function() {

	it("vertices work", function() {
		let block1 = new Utils.Block(1, 2, 3, 4, 5, 6);
		expect(block1.vertices.length).toBe(24);
		expect(block1.vertices[3]).toBe(5);

		let block2 = new Utils.Block(1, 2, 3, 4, 5, 6, {sharedVertices: false});
		expect(block2.vertices.length).toBe(72);
		expect(block2.vertices[7]).toBe(3);
	});

	it("colors work", function() {
		let block1 = new Utils.Block(1, 2, 3, 4, 5, 6);
		expect(block1.colors.length).toBe(24);
		expect(block1.colors[5]).toBe(1);

		let block2 = new Utils.Block(1, 2, 3, 4, 5, 6, {sharedVertices: false});
		expect(block2.colors.length).toBe(72);
		expect(block2.colors[6]).toBe(0);

		let block3 = new Utils.Block(1, 2, 3, 4, 5, 6, {color: [0.3, 0.5, 0.7, 0.1]});
		expect(block3.colors.length).toBe(32);
		expect(block3.colors[4]).toBe(0.3);
		expect(block3.colors[5]).toBe(0.5);
		expect(block3.colors[6]).toBe(0.7);
		expect(block3.colors[7]).toBe(0.1);

		let block4 = new Utils.Block(1, 2, 3, 4, 5, 6, {color: [1, 0.5, 0], sharedVertices: false});
		expect(block4.colors.length).toBe(72);
		expect(block4.colors[3]).toBe(1);
		expect(block4.colors[4]).toBe(0.5);
		expect(block4.colors[5]).toBe(0);
	});

	it("texture coordinates work", function() {
		let block1 = new Utils.Block(1, 2, 3, 4, 5, 6);
		expect(block1.textureCoords).toBe(undefined);

		let block2 = new Utils.Block(1, 2, 3, 4, 5, 6, {sharedVertices: false});
		expect(block2.textureCoords.length).toBe(48);
	});

	/*it("normals work", function() {
		// TODO
	});*/

	it("indices work", function() {
		let block1 = new Utils.Block(1, 2, 3, 4, 5, 6);
		expect(block1.indices.length).toBe(36);
		expect(block1.indices[35]).toBe(5);

		let block2 = new Utils.Block(1, 2, 3, 4, 5, 6, {sharedVertices: false});
		expect(block2.indices.length).toBe(36);
		expect(block2.indices[35]).toBe(22);
	});
});

describe("Utils.Face", function() {

	it("vertices work", function() {
		let face1 = new Utils.Face(1, 2, 4, 5, 6);
		expect(face1.vertices.length).toBe(12);
		expect(face1.vertices[4]).toBe(3);
		expect(face1.vertices[7]).toBe(7);

		let or = new Mat3RotX(Math.PI / 2);
		let face2 = new Utils.Face(1, 2, 4, 5, 6, {orientation: or});
		expect(face2.vertices.length).toBe(12);
		expect(face2.vertices[4]).toBe(5);
		expect(face2.vertices[8]).toBe(8);
	});

	it("colors work", function() {
		let face1 = new Utils.Face(1, 2, 4, 5, 6);
		expect(face1.colors.length).toBe(12);
		expect(face1.colors[4]).toBe(1);
		expect(face1.colors[5]).toBe(0);

		let face2 = new Utils.Face(1, 2, 4, 5, 6, {color: [0.3, 0.5, 0.7, 0.1]});
		expect(face2.colors.length).toBe(16);
		expect(face2.colors[9]).toBe(0.5);
		expect(face2.colors[10]).toBe(0.7);
	});

	it("texture coordinates work", function() {
		let face1 = new Utils.Face(1, 2, 4, 5, 6);
		expect(face1.textureCoords.length).toBe(8);
	});

	/*it("normals work", function() {
		// TODO
	});*/

	it("indices work", function() {
		let face1 = new Utils.Face(1, 2, 4, 5, 6);
		expect(face1.indices.length).toBe(6);
		expect(face1.indices[3]).toBe(2);

		let face2 = new Utils.Face(1, 2, 4, 5, 6, {strip: false});
		expect(face2.indices.length).toBe(6);
		expect(face2.indices[3]).toBe(1);
	});
});

describe("Utils.replaceComma", function() {

	it("correctly replaces comma in number", function() {
		let num = Utils.replaceComma("5,3");
		expect(num).toBeCloseTo(5.3, 5);
	});
});

describe("Utils.loadTexture", function() {
	let canvas = document.createElement("canvas");
	let gl = Utils.initWebGL(canvas);

	it("correctly loads textures", function(done) {
		Utils.loadTexture(gl, ["test.png"], (textures) => {
			expect(textures instanceof Array).toBe(true);
			expect(textures.length).toBe(1);
			expect(textures[0] instanceof WebGLTexture).toBe(true);
			expect(textures[0].image instanceof Image).toBe(true);
			done();
		});
	});
});
