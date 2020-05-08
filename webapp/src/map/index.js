import planetsFrame from "../assets/planets.json";
import planetsDataURL from "../assets/planets.png";
import { OuterSpace } from "../../../contracts/lib/outerspace";

const outerspace = new OuterSpace("0x1111111111111111111111111111111111111111111111111111111111111111"); // TODO

let planetSpriteSheet;
if (process.browser) {
  planetSpriteSheet = new Image();
  planetSpriteSheet.src = planetsDataURL;
}

const planetTypesToFrame = ["Baren.png", "Desert.png", "Forest.png", "Ice.png", "Lava.png", "Ocean.png", "Terran.png"];

let drawOnChange = true;

const lowZoomOrder = [
  0.5,
  1 / 3,
  0.25,
  1 / 5,
  1 / 6,
  1 / 7,
  1 / 8,
  1 / 9,
  1 / 10,
  1 / 11,
  1 / 12,
  1 / 13,
  1 / 14,
  1 / 15,
  1 / 16
]; //, 1/17, 1/18, 1/19, 1/20, 1/21, 1/22, 1/23, 1/24, 1/25, 1/26, 1/27, 1/28, 1/29]; // 48
let canvas;
let devicePixelRatio;
let windowDevicePxelRatio;

export default class Map {
  setup(canvas) {
    let pctx;
    const horizPattern = document.createElement("canvas");
    horizPattern.width = 48;
    horizPattern.height = 1;
    pctx = horizPattern.getContext("2d");
    pctx.fillStyle = "#4F487A";
    pctx.fillRect(0, 0, 2, 1);
    pctx.fillRect(6, 0, 36, 1);
    pctx.fillRect(46, 0, 2, 1);
    const vertPattern = document.createElement("canvas");
    vertPattern.width = 1;
    vertPattern.height = 48;
    pctx = vertPattern.getContext("2d");
    pctx.fillStyle = "#4F487A";
    pctx.fillRect(0, 0, 1, 2);
    pctx.fillRect(0, 6, 1, 36);
    pctx.fillRect(0, 46, 1, 2);

    windowDevicePxelRatio = window.devicePixelRatio;
    devicePixelRatio = 0.5; //window.devicePixelRatio;
    console.log({ devicePixelRatio: window.devicePixelRatio });
    let frame;
    const ctx = canvas.getContext("2d");
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    const hPattern = ctx.createPattern(horizPattern, "repeat-x");
    const vPattern = ctx.createPattern(vertPattern, "repeat-y");

    let camera = { x: 0, y: 0, zoom: 1, zoomIndex: -1 };
    let isPanning = false;
    let lastClientPos = { x: 0, y: 0 };

    const startPanning = e => {
      console.log("startPanning");
      isPanning = true;
      let eventX = e.clientX || e.touches[0].clientX;
      let eventY = e.clientY || e.touches[0].clientY;
      // console.log({eventX, eventY});
      lastClientPos = { x: eventX, y: eventY };
      // console.log(JSON.stringify({
      // 	world: screenToWorld(e.offsetX, e.offsetY),
      // 	screen: worldToScreen(screenToWorld(e.offsetX, e.offsetY).x, screenToWorld(e.offsetX, e.offsetY).y),
      // 	offfset: {x: e.offsetX, y: e.offsetY},
      // 	camera
      // }));
    };

    const endPanning = _e => {
      console.log("endPanning");
      isPanning = false;
    };

    const pan = e => {
      if (!isPanning) return;

      let movementX;
      let movementY;
      // if (e.movementX) {
      // 	movementX = e.movementX / windowDevicePxelRatio;
      // 	movementY = e.movementY / windowDevicePxelRatio;
      // }
      let eventX = e.clientX || e.touches[0].clientX;
      let eventY = e.clientY || e.touches[0].clientY;
      // console.log({eventX, eventY});
      movementX = eventX - lastClientPos.x;
      movementY = eventY - lastClientPos.y;
      // console.log(JSON.stringify({movementX, movementY, eMovementX: e.movementX, eMovementY: e.movementY}))
      lastClientPos = { x: eventX, y: eventY };

      console.log("panning", movementX, movementY);

      const scale = camera.zoom * devicePixelRatio;
      camera.x -= (movementX * devicePixelRatio) / scale;
      camera.y -= (movementY * devicePixelRatio) / scale;

      if (drawOnChange) {
        draw();
      }
    };

    function logEvent(name, func, options) {
      return function(e) {
        if (options && options.preventDefault) {
          e.preventDefault();
        }
        console.log(name);
        if (func) {
          return func(e);
        }
      };
    }
    canvas.onmousedown = e => {
      startPanning(e);
    };
    canvas.onmouseup = e => {
      endPanning(e);
    };
    canvas.onmousemove = e => {
      pan(e);
    };

    let isZooming = false;
    let lastDist = 0;
    let zoomPoint = { x: 0, y: 0 };

    function startZooming(e) {
      isPanning = false; // zooming override panning
      isZooming = true;
      lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      zoomPoint = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
    }

    function endZooming(_e) {
      isZooming = false;
    }

    function doZooming(e) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

      console.log(JSON.stringify({ dist, lastDist }));
      const diff = lastDist - dist;
      if (Math.abs(diff) > 50) {
        // devicePixelRatio
        const dir = Math.sign(diff);
        updateZoom(zoomPoint.x, zoomPoint.y, dir);
        lastDist = dist;
        if (drawOnChange) {
          draw();
        }
      }
    }

    function logTouchEvent(title, e) {
      let touches = [];
      for (let i = 0; i < e.touches.length; i++) {
        touches.push({ identifier: e.touches[i].identifier });
      }
      console.log(title, JSON.stringify(touches));
    }
    canvas.ontouchstart = e => {
      e.preventDefault();
      logTouchEvent("start", e);
      if (!isZooming && e.touches.length === 2) {
        startZooming(e);
      } else if (!isZooming) {
        startPanning(e);
      }
    };
    canvas.ontouchend = e => {
      e.preventDefault();
      logTouchEvent("end", e);
      if (isZooming) {
        endZooming(e);
      } else if (isPanning) {
        endPanning(e);
      }
    };
    canvas.ontouchmove = e => {
      e.preventDefault();
      logTouchEvent("move", e);
      if (isZooming) {
        if (e.touches.length != 2) {
          endZooming(e);
        } else {
          doZooming(e);
        } // TODO allow panning if one touch left?
      } else if (isPanning) {
        pan(e);
      }
    };

    function screenToWorld(x, y) {
      const scale = camera.zoom * devicePixelRatio;
      x = (x * devicePixelRatio - canvas.width / 2) / scale + camera.x;
      y = (y * devicePixelRatio - canvas.height / 2) / scale + camera.y;
      return {
        x,
        y
      };
    }

    function worldToScreen(x, y) {
      const scale = camera.zoom * devicePixelRatio;
      return {
        x: ((x - camera.x) * scale + canvas.width / 2) / devicePixelRatio,
        y: ((y - camera.y) * scale + canvas.height / 2) / devicePixelRatio
      };
    }

    function clientToCanvas(x, y) {
      x = x * devicePixelRatio;
      y = y * devicePixelRatio;
      return {
        x,
        y
      };
    }

    function updateZoom(offsetX, offsetY, dir) {
      const { x, y } = screenToWorld(offsetX, offsetY);
      const oldZoom = camera.zoom;

      if (dir > 0) {
        // console.log('zoom out');
        if (camera.zoom > 1) {
          camera.zoom--;
        } else {
          camera.zoomIndex = Math.min(camera.zoomIndex + 1, lowZoomOrder.length - 1);
          camera.zoom = lowZoomOrder[camera.zoomIndex];
          // camera.zoom /=2;
        }
      } else {
        // console.log('zoom in');
        if (camera.zoom >= 1) {
          camera.zoom++;
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
      // camera.zoom = Math.min(Math.max(0.25, camera.zoom), 2);

      const screenPos = worldToScreen(x, y);
      const delta = {
        x: Math.round((offsetX - screenPos.x) / camera.zoom),
        y: Math.round((offsetY - screenPos.y) / camera.zoom)
      };
      camera.x -= delta.x;
      camera.y -= delta.y;

      if (drawOnChange) {
        draw();
      }
    }

    canvas.onwheel = e => {
      e.preventDefault();
      const { offsetX, offsetY, deltaX, deltaY } = event;
      const dir = Math.abs(deltaY) / deltaY;

      updateZoom(offsetX, offsetY, dir);
    };

    function resize(canvas) {
      var displayWidth = Math.floor(canvas.clientWidth * devicePixelRatio);
      var displayHeight = Math.floor(canvas.clientHeight * devicePixelRatio);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        if (drawOnChange) {
          draw();
        }
      }
    }

    function draw() {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scale = camera.zoom * devicePixelRatio;

      const visible = {
        width: canvas.width / scale,
        height: canvas.height / scale
      };
      const offset = {
        // floored so it remain pixel perfect
        x: Math.floor(Math.floor((visible.width / 2 - camera.x) * scale) / scale),
        y: Math.floor(Math.floor((visible.height / 2 - camera.y) * scale) / scale)
      };
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);

      let gridLevel = 1;
      if (camera.zoom < 1) {
        gridLevel = Math.floor(1 / camera.zoom); //Math.floor(Math.floor(48 / (camera.zoom)) / 48);
      }

      const gridSize = Math.max(1, Math.pow(2, Math.floor(Math.log2(gridLevel)))) * 48;
      // const gridSize = 48 * Math.pow(2, gridLevel-1);
      // const nextLevelGridSize = 48 * Math.pow(2, gridLevel);
      const gridOffset = gridSize - gridSize / 8;
      const mainDash = gridSize - gridSize / 4;
      const smallDash = gridSize / 6 / 2;
      const lineWidth = gridSize / 6 / 2;

      const gridStart = {
        x: Math.floor((camera.x - visible.width / 2) / gridSize) * gridSize,
        y: Math.floor((camera.y - visible.height / 2) / gridSize) * gridSize
      };

      const gridLevelRoot = Math.floor(Math.sqrt((1 / camera.zoom) * 2)); //Math.floor(Math.floor(48 / (camera.zoom)) / 48);

      console.log(JSON.stringify({ gridLevelRoot, gridSize, gridLevel }));

      if (gridLevel < 10) {
        // console.log(JSON.stringify({gridLevel, gridSize, nextLevelGridSize}));

        // console.log(offset, camera);
        // console.log({lineWidth,gridStart, gridOffset, gridSize, canvasWidth: canvas.width, canvasHeight: canvas.height, zoom: camera.zoom});

        // eslint-disable-next-line no-inner-declarations
        function setColor(x) {
          if (gridSize == 48) {
            if (Math.floor(x / (8 * 48)) == x / (8 * 48)) {
              ctx.strokeStyle = "#4f5d94"; //"#6c7fc9";
            } else if (Math.floor(x / (4 * 48)) == x / (4 * 48)) {
              ctx.strokeStyle = "#3e4974"; //"#5665a1";
            } else if (Math.floor(x / (2 * 48)) == x / (2 * 48)) {
              ctx.strokeStyle = "#323b5e"; //"#434f7d";
            } else if (Math.floor(x / (1 * 48)) == x / (1 * 48)) {
              ctx.strokeStyle = "#28304c"; //"#323b52";
            } else {
              ctx.strokeStyle = "#00000";
            }
          } else if (gridSize == 2 * 48) {
            if (Math.floor(x / (8 * 48)) == x / (8 * 48)) {
              ctx.strokeStyle = "#3e4974"; //"#6c7fc9";
            } else if (Math.floor(x / (4 * 48)) == x / (4 * 48)) {
              ctx.strokeStyle = "#323b5e"; //"#5665a1";
            } else if (Math.floor(x / (2 * 48)) == x / (2 * 48)) {
              ctx.strokeStyle = "#28304c"; //"#434f7d";
            } else {
              ctx.strokeStyle = "#00000";
            }
          } else if (gridSize == 4 * 48) {
            if (Math.floor(x / (8 * 48)) == x / (8 * 48)) {
              ctx.strokeStyle = "#323b5e"; //"#6c7fc9";
            } else if (Math.floor(x / (4 * 48)) == x / (4 * 48)) {
              ctx.strokeStyle = "#28304c"; //"#5665a1";
            } else {
              ctx.strokeStyle = "#00000";
            }
          } else if (gridSize == 8 * 48) {
            if (Math.floor(x / (8 * 48)) == x / (8 * 48)) {
              ctx.strokeStyle = "#28304c"; //"#5665a1";
            } else {
              ctx.strokeStyle = "#00000";
            }
          }
        }

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
          setColor(x);
          ctx.lineWidth = lineWidth;
          // if ((x / nextLevelGridSize) == Math.floor(x / nextLevelGridSize)) {
          // 	ctx.lineWidth = lineWidth * 2;
          // }
          ctx.setLineDash([mainDash, smallDash, smallDash, smallDash]);
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
          setColor(y);
          ctx.lineWidth = lineWidth;
          // if ((y / nextLevelGridSize) == Math.floor(y / nextLevelGridSize)) {
          // 	ctx.lineWidth = lineWidth * 2;
          // }
          ctx.setLineDash([mainDash, smallDash, smallDash, smallDash]);
          ctx.moveTo(Math.round(gridStart.x - gridOffset), Math.round(y));
          ctx.lineTo(Math.round(gridStart.x + visible.width + gridOffset), Math.round(y));
          ctx.stroke();
        }
      }

      const gridX = Math.floor(gridStart.x / 48 / 4);
      const gridY = Math.floor(gridStart.y / 48 / 4);
      const gridEndX = Math.floor((gridStart.x + visible.width + gridOffset) / 48 / 4);
      const gridEndY = Math.floor((gridStart.y + visible.height + gridOffset) / 48 / 4);
      for (let x = gridX; x <= gridEndX + 1; x++) {
        for (let y = gridY; y <= gridEndY + 1; y++) {
          const planet = outerspace.getPlanetStats({ x, y });
          if (planet) {
            const lavaFrame = planetsFrame.frames[planetTypesToFrame[planet.type]].frame;
            // console.log(planet)
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              planetSpriteSheet,
              lavaFrame.x,
              lavaFrame.y,
              lavaFrame.w,
              lavaFrame.h,
              Math.round((x * 4 + planet.location.subX) * 48 - 48 / 2),
              Math.round((y * 4 + planet.location.subY) * 48 - 48 / 2),
              48,
              48
            );
          }
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = "#FDFBF3";
      ctx.lineWidth = 8; // / scale;
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
      if (!drawOnChange) {
        draw();
      }
    })();

    return () => {
      cancelAnimationFrame(frame);
    };
  }
}