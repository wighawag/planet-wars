<script>
    import { onMount } from 'svelte';
    
	let drawOnChange = true;

	let horizPattern;
	let vertPattern
	let canvas;
	let devicePixelRatio;
	let windowDevicePxelRatio;
	onMount(() => {
		let pctx;
		horizPattern = document.createElement('canvas');
		horizPattern.width = 48;
		horizPattern.height = 1;
		pctx = horizPattern.getContext("2d");
		pctx.fillStyle = "#4F487A"
		pctx.fillRect(0,0,2,1);
		pctx.fillRect(6,0,36,1);
		pctx.fillRect(46,0,2,1);
		vertPattern = document.createElement('canvas');
		vertPattern.width = 1;
		vertPattern.height = 48;
		pctx = vertPattern.getContext("2d");
		pctx.fillStyle = "#4F487A"
		pctx.fillRect(0,0,1,2);
		pctx.fillRect(0,6,1,36);
		pctx.fillRect(0,46,1,2);
	

		windowDevicePxelRatio = window.devicePixelRatio;
		devicePixelRatio = 0.5; //window.devicePixelRatio;
		console.log({devicePixelRatio: window.devicePixelRatio});
		let frame;
		const ctx = canvas.getContext('2d');
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;

		const hPattern = ctx.createPattern(horizPattern,"repeat-x");
		const vPattern = ctx.createPattern(vertPattern,"repeat-y");

		let camera = {x:0,y:0, zoom:devicePixelRatio};
		let isPanning = false;

		canvas.onmousedown = (e) => {
			isPanning = true;
		};

		canvas.onmouseup = (e) => {
			isPanning = false;
		};

		canvas.onmousemove = (e) => {
			if (!isPanning) return;
			camera.x -= (e.movementX * devicePixelRatio) / camera.zoom / windowDevicePxelRatio;
			camera.y -= (e.movementY * devicePixelRatio) / camera.zoom / windowDevicePxelRatio;

			if (drawOnChange) {draw();}
		};

		function screenToWorld(x,y) {
			x = (x * devicePixelRatio - canvas.width/2) / camera.zoom + camera.x;
			y = (y * devicePixelRatio - canvas.height/2) / camera.zoom + camera.y;
			return {
				x,
				y
			};
		}

		function worldToScreen(x,y) {
			return {
				x: ((x-camera.x) * camera.zoom + canvas.width/2) / devicePixelRatio,
				y: ((y-camera.y) * camera.zoom + canvas.height/2) / devicePixelRatio,
			};
		}

		function clientToCanvas (x, y ) {
			x = x * devicePixelRatio;
			y = y * devicePixelRatio;
			return {
				x,
				y
			};
		}

		canvas.onwheel = e => {
			e.preventDefault();
			const {offsetX, offsetY, deltaX, deltaY} = event;
			const {x,y} = screenToWorld(offsetX, offsetY);
			
			const dir = Math.abs(deltaY) / deltaY;
			const oldZoom = camera.zoom;
			// camera.zoom -= deltaY * 0.001;
			if (dir > 0) {
				camera.zoom /=2;
			} else {
				camera.zoom *= 2;
			}
			camera.zoom = Math.min(Math.max(0.125 * devicePixelRatio, camera.zoom), 2 * devicePixelRatio);

			const screenPos = worldToScreen(x,y);
			const delta = {
				x: (offsetX - screenPos.x) * devicePixelRatio / camera.zoom,
				y: (offsetY - screenPos.y) * devicePixelRatio / camera.zoom,
			}
			camera.x -= delta.x;
			camera.y -= delta.y;
			
			if (drawOnChange) {draw();}
		}

		function resize(canvas) {
			var displayWidth  = Math.floor(canvas.clientWidth  * devicePixelRatio);
			var displayHeight = Math.floor(canvas.clientHeight * devicePixelRatio);

			if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
				canvas.width  = displayWidth;
				canvas.height = displayHeight;
				if (drawOnChange) {draw();}
			}
		}

		function draw() {
			ctx.save();
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const visible = {
				width: (canvas.width / camera.zoom),
				height: (canvas.height / camera.zoom)
			};
			const offset = {
				x: visible.width / 2 - camera.x,
				y: visible.height / 2 - camera.y,
			}
			ctx.scale(camera.zoom, camera.zoom);
			ctx.translate(Math.round(offset.x), Math.round(offset.y));

			const gridSize = camera.zoom > devicePixelRatio ? 48 : Math.floor(Math.floor(48 / (camera.zoom / devicePixelRatio)) / 48) * 48;
			const gridOffset = gridSize - gridSize / 8;
			const mainDash = gridSize - gridSize / 4;
			const smallDash = gridSize / 6 / 2;
			const lineWidth = gridSize / 6 / 2;

			const gridStart = {
				x: Math.floor((camera.x - visible.width /2) / gridSize) * gridSize,
				y: Math.floor((camera.y - visible.height/2) / gridSize) * gridSize
			};

			for (let x = gridStart.x; x < gridStart.x + visible.width + gridOffset; x += gridSize) {
				// ctx.fillStyle = vPattern;
				// ctx.save();
				// ctx.scale(1, gridSize / 48);
				// ctx.fillRect(x-lineWidth/2, gridStart.y, lineWidth, visible.height + gridOffset);
				// ctx.restore();

				for (let y = gridStart.y; y < gridStart.y + visible.height + gridOffset; y += gridSize) {
					ctx.drawImage(vertPattern, Math.round(x-lineWidth/2), Math.round(y), Math.round(lineWidth), Math.round(gridSize));
				}
				
				// ctx.beginPath();
				// ctx.strokeStyle = "#4F487A";
				// ctx.lineWidth = lineWidth;
				// ctx.setLineDash([mainDash,smallDash,smallDash,smallDash]);
				// ctx.moveTo(Math.round(x), Math.round(gridStart.y - gridOffset)); // TODO use drawImage for line pattern to avoid anti-aliasing
				// ctx.lineTo(Math.round(x), Math.round(gridStart.y + visible.height + gridOffset));
				// ctx.stroke();
			}

			for (let y = gridStart.y; y < gridStart.y + visible.height + gridOffset; y += gridSize) {
				// ctx.fillStyle = hPattern;
				// ctx.save();
				// ctx.scale(gridSize / 48, 1);
				// ctx.fillRect(gridStart.x, y-lineWidth/2, visible.width + gridOffset, lineWidth);
				// ctx.restore();
				
				for (let x = gridStart.x; x < gridStart.x + visible.width + gridOffset; x += gridSize) {
					ctx.drawImage(horizPattern, Math.round(x), Math.round(y-lineWidth/2), Math.round(gridSize), Math.round(lineWidth));
				}
				
				ctx.beginPath();
				ctx.strokeStyle = "#4F487A";
				ctx.lineWidth = lineWidth;
				ctx.setLineDash([mainDash,smallDash,smallDash,smallDash]);
				ctx.moveTo(Math.round(gridStart.x - gridOffset), Math.round(y));
				ctx.lineTo(Math.round(gridStart.x + visible.width + gridOffset), Math.round(y));
				ctx.stroke();
			}

			ctx.beginPath();
			ctx.strokeStyle = "#FDFBF3";
			ctx.lineWidth = 8;
			ctx.setLineDash([]);
			ctx.moveTo(-64, 0);
			ctx.lineTo(64, 0);
			ctx.moveTo(0, -64);
			ctx.lineTo(0, 64);
			ctx.stroke();
		
			ctx.restore();
		}
		

		(function loop() {
            frame = requestAnimationFrame(loop);
            resize(canvas);
			if (!drawOnChange) {draw();}
		}());

		return () => {
			cancelAnimationFrame(frame);
		};
	});
</script>

<style>
	canvas {
		width: 100%;
		height: 100%;
		background-color: #272e49;
		image-rendering: -moz-crisp-edges;
		image-rendering: -webkit-crisp-edges;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}
</style>

<canvas bind:this={canvas}/>
