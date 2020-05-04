<script>
    import { onMount } from 'svelte';
    
	let drawOnChange = true;

	let canvas;
	let devicePixelRatio;
	let windowDevicePxelRatio;
	onMount(() => {
		windowDevicePxelRatio = window.devicePixelRatio;
		devicePixelRatio = 1; //window.devicePixelRatio;
		console.log({devicePixelRatio: window.devicePixelRatio});
		let frame;
		const ctx = canvas.getContext('2d');
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;

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
				camera.zoom *=2;
			} else {
				camera.zoom /= 2;
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
			ctx.translate(offset.x, offset.y);

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
				ctx.beginPath();
				ctx.strokeStyle = "#4F487A";
				ctx.lineWidth = lineWidth;
				ctx.setLineDash([mainDash,smallDash,smallDash,smallDash]);
				ctx.moveTo(x, gridStart.y - gridOffset);
				ctx.lineTo(x, gridStart.y + visible.height + gridOffset);
				ctx.stroke();
			}

			for (let y = gridStart.y; y < gridStart.y + visible.height + gridOffset; y += gridSize) {
				ctx.beginPath();
				ctx.strokeStyle = "#4F487A";
				ctx.lineWidth = lineWidth;
				ctx.setLineDash([mainDash,smallDash,smallDash,smallDash]);
				ctx.moveTo(gridStart.x - gridOffset, y);
				ctx.lineTo(gridStart.x + visible.width + gridOffset, y);
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
