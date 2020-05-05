<script>
    import { onMount } from 'svelte';
    
	let drawOnChange = true;

	const lowZoomOrder = [0.5, 1/3, 0.25, 1/6, 0.125, 0.0625]; // 48 
	let canvas;
	let devicePixelRatio;
	let windowDevicePxelRatio;
	onMount(() => {
		let pctx;
		const horizPattern = document.createElement('canvas');
		horizPattern.width = 48;
		horizPattern.height = 1;
		pctx = horizPattern.getContext("2d");
		pctx.fillStyle = "#4F487A"
		pctx.fillRect(0,0,2,1);
		pctx.fillRect(6,0,36,1);
		pctx.fillRect(46,0,2,1);
		const vertPattern = document.createElement('canvas');
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

		let camera = {x:0,y:0, zoom: 1, zoomIndex: -1};
		let isPanning = false;

		canvas.onmousedown = (e) => {
			isPanning = true;
			// console.log(JSON.stringify({
			// 	world: screenToWorld(e.offsetX, e.offsetY),
			// 	screen: worldToScreen(screenToWorld(e.offsetX, e.offsetY).x, screenToWorld(e.offsetX, e.offsetY).y),
			// 	offfset: {x: e.offsetX, y: e.offsetY}
			// }));
		};

		canvas.onmouseup = (e) => {
			isPanning = false;
		};

		canvas.onmousemove = (e) => {
			if (!isPanning) return;
			const scale = camera.zoom * devicePixelRatio;
			camera.x -= (e.movementX * devicePixelRatio) / scale / windowDevicePxelRatio;
			camera.y -= (e.movementY * devicePixelRatio) / scale / windowDevicePxelRatio;

			if (drawOnChange) {draw();}
		};

		function screenToWorld(x,y) {
			const scale = camera.zoom * devicePixelRatio;
			x = (x * devicePixelRatio - canvas.width/2) / scale + camera.x;
			y = (y * devicePixelRatio - canvas.height/2) / scale + camera.y;
			return {
				x,
				y
			};
		}

		function worldToScreen(x,y) {
			const scale = camera.zoom * devicePixelRatio;
			return {
				x: ((x-camera.x) * scale + canvas.width/2) / devicePixelRatio,
				y: ((y-camera.y) * scale + canvas.height/2) / devicePixelRatio,
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

			// console.log(JSON.stringify(camera));
			if (dir > 0) {
				// console.log('zoom out');
				if (camera.zoom > 1) {
					camera.zoom --;	
				} else {
					camera.zoomIndex = Math.min(camera.zoomIndex + 1, lowZoomOrder.length - 1);
					camera.zoom = lowZoomOrder[camera.zoomIndex];
					// camera.zoom /=2;
				}
			} else {
				// console.log('zoom in');
				if (camera.zoom >= 1) {
					camera.zoom ++;	
				} else {
					camera.zoomIndex = camera.zoomIndex - 1;
					if (camera.zoomIndex < 0) {
						camera.zoomIndex = -1;
						camera.zoom = 1;
					} else {
						camera.zoom = lowZoomOrder[camera.zoomIndex];
					}
					
					// camera.zoom *=2;
				}
			}
			// console.log(JSON.stringify(camera));
			camera.zoom = Math.min(Math.max(0.125, camera.zoom), 2);

			const screenPos = worldToScreen(x,y);
			const delta = {
				x: Math.round((offsetX - screenPos.x) / camera.zoom),
				y: Math.round((offsetY - screenPos.y) / camera.zoom)
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

			const scale = camera.zoom * devicePixelRatio;

			const visible = {
				width: (canvas.width / scale),
				height: (canvas.height / scale)
			};
			const offset = { // floored so it remain pixel perfect
				x: Math.floor(Math.floor( (visible.width / 2 - camera.x) * scale) / scale),
				y: Math.floor(Math.floor( (visible.height / 2 - camera.y) * scale) / scale)
			}
			ctx.scale(scale, scale);
			ctx.translate(offset.x, offset.y);

			const gridSize = camera.zoom > 1 ? 48 : Math.floor(Math.floor(48 / (camera.zoom)) / 48) * 48;
			const gridOffset = gridSize - gridSize / 8;
			const mainDash = gridSize - gridSize / 4;
			const smallDash = gridSize / 6 / 2;
			const lineWidth = gridSize / 6 / 2;

			const gridStart = {
				x: Math.floor((camera.x - visible.width /2) / gridSize) * gridSize,
				y: Math.floor((camera.y - visible.height/2) / gridSize) * gridSize
			};

			// console.log(offset, camera);
			// console.log({lineWidth,gridStart, gridOffset, gridSize, canvasWidth: canvas.width, canvasHeight: canvas.height, zoom: camera.zoom});

			for (let x = gridStart.x; x < gridStart.x + visible.width + gridOffset; x += gridSize) {
				// ctx.fillStyle = vPattern;
				// ctx.save();
				// ctx.scale(1, gridSize / 48);
				// ctx.fillRect(x-lineWidth/2, gridStart.y, lineWidth, visible.height + gridOffset);
				// ctx.restore();

				// // console.log('x', Math.round(x-lineWidth/2), Math.round(gridStart.y), Math.round(lineWidth), Math.round(gridSize))
				// for (let y = gridStart.y; y < gridStart.y + visible.height + gridOffset; y += gridSize) {
				// 	ctx.drawImage(vertPattern, Math.round(x-lineWidth/2), Math.round(y), Math.round(lineWidth), Math.round(gridSize));
				// }
				
				ctx.beginPath();
				ctx.strokeStyle = "#4F487A";
				ctx.lineWidth = lineWidth;
				ctx.setLineDash([mainDash,smallDash,smallDash,smallDash]);
				ctx.moveTo(Math.round(x), Math.round(gridStart.y - gridOffset)); // TODO use drawImage for line pattern to avoid anti-aliasing
				ctx.lineTo(Math.round(x), Math.round(gridStart.y + visible.height + gridOffset));
				ctx.stroke();
			}

			for (let y = gridStart.y; y < gridStart.y + visible.height + gridOffset; y += gridSize) {
				// ctx.fillStyle = hPattern;
				// ctx.save();
				// ctx.scale(gridSize / 48, 1);
				// ctx.fillRect(gridStart.x, y-lineWidth/2, visible.width + gridOffset, lineWidth);
				// ctx.restore();
				
				// // console.log('y', Math.round(gridStart.x), Math.round(y-lineWidth/2), Math.round(gridSize), Math.round(lineWidth))
				// for (let x = gridStart.x; x < gridStart.x + visible.width + gridOffset; x += gridSize) {
				// 	ctx.drawImage(horizPattern, Math.round(x), Math.round(y-lineWidth/2), Math.round(gridSize), Math.round(lineWidth));
				// }
				
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
			ctx.lineWidth = 8;// / scale;
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
