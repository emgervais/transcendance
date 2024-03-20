var gl = null;

function normalize(v)
{
	const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	return [v[0] / l, v[1] / l, v[2] / l];
}

function angleToVector(pitch, yaw)
{
	const cosPitch = Math.cos(pitch);
	const sinPitch = Math.sin(pitch);
	const cosYaw = Math.cos(yaw);
	const sinYaw = Math.sin(yaw);
	return [cosYaw * cosPitch, sinPitch, sinYaw * cosPitch];

}

function createProgram(vertexShaderSource, fragmentShaderSource)
{
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSource);
	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
	{
		console.error(gl.getShaderInfoLog(vertexShader));
		return false;
	}
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSource);
	gl.compileShader(fragmentShader);
	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
	{
		console.error(gl.getShaderInfoLog(fragmentShader));
		return false;
	}
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);

	return program;
}

function newProjectionMatrix(fov, aspect, near, far)
{
	const f = 1.0 / Math.tan(fov / 2);
	const nf = 1.0 / (near - far);
	return {
		_matrix: new Float32Array([
				f / aspect, 0, 0, 0,
				0, f, 0, 0,
				0, 0, (far + near) * nf, -1,
				0, 0, (2 * far * near) * nf, 0
			]),
		update: function(fov, aspect, near, far)
		{
			const f = 1.0 / Math.tan(fov / 2);
			const nf = 1.0 / (near - far);
			this._matrix[0] = f / aspect;
			this._matrix[5] = f;
			this._matrix[10] = (far + near) * nf;
			this._matrix[14] = (2 * far * near) * nf;
		}
	};
}
function newViewMatrix(x, y, z, pitch, yaw)
{
	const up = [0, 1, 0];
	const f = angleToVector(pitch, yaw);
	const s = normalize([f[1] * up[2] - f[2] * up[1], f[2] * up[0] - f[0] * up[2], f[0] * up[1] - f[1] * up[0]]);
	const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];

	return {
		_matrix: new Float32Array([
				s[0], u[0], -f[0], 0,
				s[1], u[1], -f[1], 0,
				s[2], u[2], -f[2], 0,
				-s[0] * x - s[1] * y - s[2] * z, -u[0] * x - u[1] * y - u[2] * z, f[0] * x + f[1] * y + f[2] * z, 1
			]),
		update: function(x, y, z, pitch, yaw)
		{
			const f = angleToVector(pitch, yaw);
			const s = normalize([f[1] * up[2] - f[2] * up[1], f[2] * up[0] - f[0] * up[2], f[0] * up[1] - f[1] * up[0]]);
			const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
			this._matrix[0] = s[0];
			this._matrix[1] = u[0];
			this._matrix[2] = -f[0];
			this._matrix[4] = s[1];
			this._matrix[5] = u[1];
			this._matrix[6] = -f[1];
			this._matrix[8] = s[2];
			this._matrix[9] = u[2];
			this._matrix[10] = -f[2];
			this._matrix[12] = -s[0] * x - s[1] * y - s[2] * z;
			this._matrix[13] = -u[0] * x - u[1] * y - u[2] * z;
			this._matrix[14] = f[0] * x + f[1] * y + f[2] * z;
		}
	};
}
function newTranslationMatrix(x, y, z)
{
	return {
		_matrix: new Float32Array([
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				x, y, z, 1
			]),
		update: function(x, y, z)
			{
				this._matrix[12] = x;
				this._matrix[13] = y;
				this._matrix[14] = z;
			}
	};
}
function newRotationMatrix(pitch, yaw, roll)
{
	const cosPitch = Math.cos(pitch);
	const sinPitch = Math.sin(pitch);
	const cosYaw = Math.cos(yaw);
	const sinYaw = Math.sin(yaw);
	const cosRoll = Math.cos(roll);
	const sinRoll = Math.sin(roll);
	return {
		_matrix: new Float32Array([
				cosYaw * cosRoll + sinYaw * sinPitch * sinRoll, cosRoll * sinYaw * sinPitch - cosYaw * sinRoll, cosPitch * sinYaw, 0,
				cosPitch * sinRoll, cosPitch * cosRoll, -sinPitch, 0,
				cosYaw * sinPitch * sinRoll - cosRoll * sinYaw, cosYaw * cosRoll * sinPitch + sinYaw * sinRoll, cosYaw * cosPitch, 0,
				0, 0, 0, 1
			]),
		update: function(pitch, yaw, roll)
		{
			const cosPitch = Math.cos(pitch);
			const sinPitch = Math.sin(pitch);
			const cosYaw = Math.cos(yaw);
			const sinYaw = Math.sin(yaw);
			const cosRoll = Math.cos(roll);
			const sinRoll = Math.sin(roll);
			this._matrix[0] = cosYaw * cosRoll + sinYaw * sinPitch * sinRoll;
			this._matrix[1] = cosRoll * sinYaw * sinPitch - cosYaw * sinRoll;
			this._matrix[2] = cosPitch * sinYaw;
			this._matrix[4] = cosPitch * sinRoll;
			this._matrix[5] = cosPitch * cosRoll;
			this._matrix[6] = -sinPitch;
			this._matrix[8] = cosYaw * sinPitch * sinRoll - cosRoll * sinYaw;
			this._matrix[9] = cosYaw * cosRoll * sinPitch + sinYaw * sinRoll;
			this._matrix[10] = cosYaw * cosPitch;
		}
	};
}
function newScaleMatrix(x, y, z)
{
	return {
		_matrix: new Float32Array([
				x, 0, 0, 0,
				0, y, 0, 0,
				0, 0, z, 0,
				0, 0, 0, 1
			]),
		update: function(x, y, z)
		{
			this._matrix[0] = x;
			this._matrix[5] = y;
			this._matrix[10] = z;
		}
	};
}

function createStaticBuffer(data)
{
	let b = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, b);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	return b;
}

function createVAO()
{
	const VAO = {
		buffers: [],
		_vao: gl.createVertexArray(),
		bind: function()
		{
			gl.bindVertexArray(this._vao);
		},
		addBuffer: function(buffer, index, size, type, normalized, stride, offset)
		{
			this.bind();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
			gl.enableVertexAttribArray(index);
			this.buffers.push(buffer);
		}
	};
	gl.bindVertexArray(VAO._vao);
	return VAO;
}

function unbindVAO()
{
	gl.bindVertexArray(null);
}

function createUBO(name, program, id)
{
	const ubo = {
		_ubo: gl.createBuffer(),
		bind: function()
		{
			gl.bindBuffer(gl.UNIFORM_BUFFER, this._ubo);
		},
		update: function(data, pos = 0)
		{
			this.bind();
			gl.bufferSubData(gl.UNIFORM_BUFFER, pos, data);
		},
		size: 0,
		bindToProgram: function(program)
		{
			const blockIndex = gl.getUniformBlockIndex(program, name);
			gl.uniformBlockBinding(program, blockIndex, id);
		}
	};
	const blockIndex = gl.getUniformBlockIndex(program, name);
	ubo.size = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
	ubo.bind();
	gl.bufferData(gl.UNIFORM_BUFFER, ubo.size, gl.DYNAMIC_DRAW);
	gl.bindBufferBase(gl.UNIFORM_BUFFER, id, ubo._ubo);

	return ubo;
}
function createTexture(imagesrc, internalformat, format, id)
{
	const texture = {
		_texture: gl.createTexture(),
		bind: function()
		{
			gl.activeTexture(gl.TEXTURE0 + id);
			gl.bindTexture(gl.TEXTURE_2D, this._texture);
		},
		update: function(data, format, width, height)
		{
			this.bind();
			gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, data);
		}
	};
	const i = new Image();
	i.onload = function()
	{
		gl.activeTexture(gl.TEXTURE0 + id);
		texture.bind();
		gl.texImage2D(gl.TEXTURE_2D, 0, internalformat, format, gl.UNSIGNED_BYTE, i);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		// gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE0);
	};
	i.src = imagesrc;
	return texture;
}

function createFramebuffer(width, height)
{
	const framebuffer = {
		_framebuffer: gl.createFramebuffer(),
		_depthbuffer: gl.createRenderbuffer(),
		_texture: gl.createTexture(),
		width: width,
		height: height,
		bind: function()
		{
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
		},
		bindTexture: function()
		{
			gl.bindTexture(gl.TEXTURE_2D, this._texture);
		}
	};
	framebuffer.bind();
	framebuffer.bindTexture();
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebuffer._texture, 0);
	gl.bindRenderbuffer(gl.RENDERBUFFER, framebuffer._depthbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, framebuffer._depthbuffer);
	const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if(status != gl.FRAMEBUFFER_COMPLETE)
	{
		console.error("Framebuffer incomplete");
		return false;
	}
	return framebuffer;

}

function newModel(objurl, textureurl)
{
	// parse obj file
	const xhr = new XMLHttpRequest();
	xhr.open("GET", objurl, false);
	xhr.send();
	const obj = xhr.responseText.split("\n");
	const vertices = [];
	const normals = [];
	const uvs = [];
	const faces = [];
	const map = new Map();
	const indices = [];
	for(let i = 0; i < obj.length; i++)
	{
		const line = obj[i].split(" ");
		if(line[0] == "v")
			vertices.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
		else if(line[0] == "vn")
			normals.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
		else if(line[0] == "vt")
			uvs.push([parseFloat(line[1]), parseFloat(line[2])]);
		else if(line[0] == "f")
		{
			for(let j = 1; j < 4; j++)
			{
				const index = line[j].split("/");
				const key = [parseInt(index[0]) - 1, parseInt(index[1]) - 1, parseInt(index[2]) - 1];
				if(!map.has(key))
				{
					indices.push(map.size);
					map.set(key, map.size);
				}
				else
					indices.push(map.get(key));
			}
		}
	}
	// console.log("Model loaded: " + objurl);
	// console.log(vertices);
	// console.log(normals);
	// console.log(uvs);
	// console.log(faces);

	const vertbuf = new Float32Array(map.size * 3);
	const normbuf = new Float32Array(map.size * 3);
	const uvbuf = new Float32Array(map.size * 2);
	const indexbuf = new Uint32Array(indices);
	map.forEach((value, key) => {
		vertbuf[value * 3] = vertices[key[0]][0];
		vertbuf[value * 3 + 1] = vertices[key[0]][1];
		vertbuf[value * 3 + 2] = vertices[key[0]][2];
		normbuf[value * 3] = normals[key[2]][0];
		normbuf[value * 3 + 1] = normals[key[2]][1];
		normbuf[value * 3 + 2] = normals[key[2]][2];
		uvbuf[value * 2] = uvs[key[1]][0];
		uvbuf[value * 2 + 1] = uvs[key[1]][1];
	});

	// load texture
	const texture = createTexture(textureurl, gl.RGBA, gl.RGBA, 0);

	const model = {
		_vao: createVAO(),
		_indices: gl.createBuffer(),
		_numIndices: indices.length,
		_texture: texture,
		_uboT: newTranslationMatrix(0, 0, 0),
		_uboR: newRotationMatrix(0, 0, 0),
		_uboS: newScaleMatrix(1, 1, 1),
		move: function(x, y, z) {this._uboT.update(x, y, z);},
		rotate: function(pitch, yaw, roll) {this._uboR.update(pitch, yaw, roll);},
		scale: function(x, y, z) {this._uboS.update(x, y, z);},
		uploadT: function(mainUBO) {mainUBO.update(this._uboT._matrix);},
		uploadR: function(mainUBO) {mainUBO.update(this._uboR._matrix, 64);},
		uploadS: function(mainUBO) {mainUBO.update(this._uboS._matrix, 128);},
		bind: function()
		{
			this._vao.bind();
			gl.activeTexture(gl.TEXTURE0 + 1);
			this._texture.bind();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indices);
		},
		draw: function(mainUBO)
		{
			this.bind();
			this.uploadT(mainUBO);
			this.uploadR(mainUBO);
			this.uploadS(mainUBO);
			gl.drawElements(gl.TRIANGLES, this._numIndices, gl.UNSIGNED_INT, 0);
		}
	};

	model._vao.addBuffer(createStaticBuffer(vertbuf), 0, 3, gl.FLOAT, false, 0, 0);
	model._vao.addBuffer(createStaticBuffer(uvbuf), 1, 2, gl.FLOAT, false, 0, 0);
	model._vao.addBuffer(createStaticBuffer(normbuf), 2, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model._indices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexbuf, gl.STATIC_DRAW);

	return model;
}

function initGL(canvas)
{
	gl = canvas.getContext("webgl2");
	if(!gl)
	{
		console.error("WebGL not supported");
		return false;
	}
	return true;
}

export {newModel, normalize, angleToVector, createProgram, newProjectionMatrix, newViewMatrix, newTranslationMatrix, newRotationMatrix, newScaleMatrix, createStaticBuffer, createVAO, unbindVAO, createUBO, createTexture, createFramebuffer, initGL, gl}
