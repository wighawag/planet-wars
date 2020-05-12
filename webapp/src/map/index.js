import planetsFrame from "../assets/planets.json";
import planetsDataURL from "../assets/planets.png";
import { OuterSpace } from "../../../contracts/lib/outerspace";

const outerspace = new OuterSpace("0x1111111111111111111111111111111111111111111111111111111111111111"); // TODO

// pre-render
let planetSpriteSheet;
let horizPattern;
let vertPattern;
if (process.browser) {
  planetSpriteSheet = new Image();
  planetSpriteSheet.src = planetsDataURL;
  let pctx;
  horizPattern = document.createElement("canvas");
  horizPattern.width = 48;
  horizPattern.height = 1;
  pctx = horizPattern.getContext("2d");
  pctx.fillStyle = "#4F487A";
  pctx.fillRect(0, 0, 2, 1);
  pctx.fillRect(6, 0, 36, 1);
  pctx.fillRect(46, 0, 2, 1);
  vertPattern = document.createElement("canvas");
  vertPattern.width = 1;
  vertPattern.height = 48;
  pctx = vertPattern.getContext("2d");
  pctx.fillStyle = "#4F487A";
  pctx.fillRect(0, 0, 1, 2);
  pctx.fillRect(0, 6, 1, 36);
  pctx.fillRect(0, 46, 1, 2);
}

const planetTypesToFrame = ["Baren.png", "Desert.png", "Forest.png", "Ice.png", "Lava.png", "Ocean.png", "Terran.png"];

let drawOnChange = true;

class Renderer {
  constructor() {}

  setup(ctx) {
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    this.hPattern = ctx.createPattern(horizPattern, "repeat-x");
    this.vPattern = ctx.createPattern(vertPattern, "repeat-y");
  }

  render(ctx, camera) {
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
      x: Math.floor((camera.x - camera.width / 2) / gridSize) * gridSize,
      y: Math.floor((camera.y - camera.height / 2) / gridSize) * gridSize
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

      for (let x = gridStart.x; x < gridStart.x + camera.width + gridOffset; x += gridSize) {
        // ctx.fillStyle = vPattern;
        // ctx.save();
        // ctx.scale(1, gridSize / 48);
        // ctx.fillRect(x-lineWidth/2, gridStart.y, lineWidth, camera.height + gridOffset);
        // ctx.restore();

        // // console.log('x', Math.round(x-lineWidth/2), Math.round(gridStart.y), Math.round(lineWidth), Math.round(gridSize))
        // for (let y = gridStart.y; y < gridStart.y + camera.height + gridOffset; y += gridSize) {
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
        ctx.lineTo(Math.round(x), Math.round(gridStart.y + camera.height + gridOffset));
        ctx.stroke();
      }

      for (let y = gridStart.y; y < gridStart.y + camera.height + gridOffset; y += gridSize) {
        // ctx.fillStyle = hPattern;
        // ctx.save();
        // ctx.scale(gridSize / 48, 1);
        // ctx.fillRect(gridStart.x, y-lineWidth/2, camera.width + gridOffset, lineWidth);
        // ctx.restore();

        // // console.log('y', Math.round(gridStart.x), Math.round(y-lineWidth/2), Math.round(gridSize), Math.round(lineWidth))
        // for (let x = gridStart.x; x < gridStart.x + camera.width + gridOffset; x += gridSize) {
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
        ctx.lineTo(Math.round(gridStart.x + camera.width + gridOffset), Math.round(y));
        ctx.stroke();
      }
    }

    const gridX = Math.floor(gridStart.x / 48 / 4 / 2);
    const gridY = Math.floor(gridStart.y / 48 / 4 / 2);
    const gridEndX = Math.floor((gridStart.x + camera.width + gridOffset) / 48 / 4 / 2);
    const gridEndY = Math.floor((gridStart.y + camera.height + gridOffset) / 48 / 4 / 2);
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
            Math.round((x * 4 * 2 + planet.location.subX * 2) * 48 - 48 / 2),
            Math.round((y * 4 * 2 + planet.location.subY * 2) * 48 - 48 / 2),
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
  }
}

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
class Camera {
  constructor() {
    this.zoomIndex = -1;
    this.render = {
      // could be computed on the fly
      x: 0,
      y: 0,
      scale: 1,
      devicePixelRatio: 1
    };
    this.world = {
      x: 0,
      y: 0,
      zoom: 1
    };
  }

  _set(x, y, zoom) {
    this.world.x = x;
    this.world.y = y;
    this.world.zoom = zoom;

    const scale = this.world.zoom * this.render.devicePixelRatio;
    this.render.scale = scale;
    this.world.width = this.canvas.width / scale;
    this.world.height = this.canvas.height / scale;

    this.render.x = Math.floor(Math.floor((this.world.width / 2 - this.world.x) * scale) / scale);
    this.render.y = Math.floor(Math.floor((this.world.height / 2 - this.world.y) * scale) / scale);
  }

  setup(canvas, onChange) {
    const self = this;
    this.canvas = canvas;
    // this.windowDevicePxelRatio = window.devicePixelRatio;
    this.render.devicePixelRatio = 0.5; //window.devicePixelRatio;

    let isPanning = false;
    let lastClientPos = { x: 0, y: 0 };

    const _set = (x, y, zoom) => {
      this._set(x, y, zoom);
      onChange();
    };

    const _update = () => {
      _set(this.world.x, this.world.y, this.world.zoom);
    };

    const startPanning = e => {
      console.log("startPanning");
      isPanning = true;
      let eventX = e.clientX || e.touches[0].clientX;
      let eventY = e.clientY || e.touches[0].clientY;
      lastClientPos = { x: eventX, y: eventY };
    };

    const onClick = (x, y) => {
      const worldPos = screenToWorld(x, y);
      const gridPos = {
        x: Math.round(worldPos.x / 48 / 2),
        y: Math.round(worldPos.y / 48 / 2)
      };
      const shifted = {
        x: gridPos.x + 2,
        y: gridPos.y + 2
      };
      if (shifted.x % 4 == 0 || shifted.y % 4 == 0) {
        console.log("boundaries");
        return;
      }
      const location = {
        x: Math.floor(shifted.x / 4),
        y: Math.floor(shifted.y / 4),
        subX: (shifted.x % 4) - 2 * Math.sign(shifted.x),
        subY: (shifted.y % 4) - 2 * Math.sign(shifted.y)
      };
      location.id = ""; // TODO
      console.log("onClick", JSON.stringify({ worldPos, gridPos, location, shifted }, null, "  "));
      const planet = outerspace.getPlanetStats(location);
      if (planet && planet.location.subX == location.subX && planet.location.subY == location.subY) {
        console.log(JSON.stringify(planet, null, "  "));
      } else {
        console.log("no planet");
      }
    };

    const endPanning = e => {
      console.log("endPanning");
      isPanning = false;
      let eventX = e.clientX || e.touches[0].clientX;
      let eventY = e.clientY || e.touches[0].clientY;
      const dist = Math.hypot(eventX - lastClientPos.x, eventY - lastClientPos.y);
      if (dist < 22) {
        // TODO : devicePixelRatio?
        // TODO time too ?
        onClick(lastClientPos.x, lastClientPos.y);
      }
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

      const devicePixelRatio = this.render.devicePixelRatio;
      const scale = this.world.zoom * devicePixelRatio;
      this.world.x -= (movementX * devicePixelRatio) / scale;
      this.world.y -= (movementY * devicePixelRatio) / scale;
      _update();
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
      const devicePixelRatio = self.render.devicePixelRatio;
      const scale = self.world.zoom * devicePixelRatio;
      x = (x * devicePixelRatio - canvas.width / 2) / scale + self.world.x;
      y = (y * devicePixelRatio - canvas.height / 2) / scale + self.world.y;
      return {
        x,
        y
      };
    }

    function worldToScreen(x, y) {
      const devicePixelRatio = self.render.devicePixelRatio;
      const scale = self.world.zoom * devicePixelRatio;
      return {
        x: ((x - self.world.x) * scale + self.canvas.width / 2) / devicePixelRatio,
        y: ((y - self.world.y) * scale + self.canvas.height / 2) / devicePixelRatio
      };
    }

    function clientToCanvas(x, y) {
      const devicePixelRatio = self.render.devicePixelRatio;
      x = x * devicePixelRatio;
      y = y * devicePixelRatio;
      return {
        x,
        y
      };
    }

    function updateZoom(offsetX, offsetY, dir) {
      const { x, y } = screenToWorld(offsetX, offsetY);
      const oldZoom = self.world.zoom;

      if (dir > 0) {
        // console.log('zoom out');
        if (self.world.zoom > 1) {
          self.world.zoom--;
        } else {
          self.zoomIndex = Math.min(self.zoomIndex + 1, lowZoomOrder.length - 1);
          self.world.zoom = lowZoomOrder[self.zoomIndex];
          // self.world.zoom /=2;
        }
      } else {
        // console.log('zoom in');
        if (self.world.zoom >= 1) {
          self.world.zoom++;
        } else {
          self.zoomIndex = self.zoomIndex - 1;
          if (self.zoomIndex < 0) {
            self.zoomIndex = -1;
            self.world.zoom = 1;
          } else {
            self.world.zoom = lowZoomOrder[self.zoomIndex];
          }

          // self.world.zoom *=2;
        }
      }
      // self.world.zoom = Math.min(Math.max(0.25, self.world.zoom), 2);

      const screenPos = worldToScreen(x, y);
      const delta = {
        x: Math.round((offsetX - screenPos.x) / self.world.zoom),
        y: Math.round((offsetY - screenPos.y) / self.world.zoom)
      };
      self.world.x -= delta.x;
      self.world.y -= delta.y;
      _update();
    }

    canvas.onwheel = e => {
      e.preventDefault();
      const { offsetX, offsetY, deltaX, deltaY } = event;
      const dir = Math.abs(deltaY) / deltaY;

      updateZoom(offsetX, offsetY, dir);
    };
  }

  onRender() {
    const canvas = this.canvas;
    const devicePixelRatio = this.render.devicePixelRatio;
    var displayWidth = Math.floor(canvas.clientWidth * devicePixelRatio);
    var displayHeight = Math.floor(canvas.clientHeight * devicePixelRatio);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      this._set(this.world.x, this.world.y, this.world.zoom);
      return true;
    }
  }
}

export default class Map {
  constructor(renderer, camera) {
    this.renderer = renderer || new Renderer();
    this.camera = camera || new Camera();
  }
  setup(canvas) {
    const self = this;
    const ctx = canvas.getContext("2d");
    this.renderer.setup(ctx);

    const draw = () => {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scale = this.camera.render.scale;
      ctx.scale(scale, scale);
      ctx.translate(this.camera.render.x, this.camera.render.y);

      this.renderer.render(ctx, this.camera.world);
      ctx.restore();
    };

    this.camera.setup(canvas, () => {
      if (drawOnChange) draw();
    });

    let frame;
    (function loop() {
      frame = requestAnimationFrame(loop);
      if (self.camera.onRender() || !drawOnChange) {
        draw();
      }
    })();
    return () => {
      cancelAnimationFrame(frame);
    };
  }
}
