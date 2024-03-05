var gl;

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

function createStaticBuffer(data)
{
	b = gl.createBuffer();
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
		update: function(data)
		{
			this.bind();
			gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data);
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
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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