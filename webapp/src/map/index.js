import { Renderer } from "./renderer";
import { Camera } from "./camera";
import { Controller } from "./controller";

let drawOnChange = true;

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

    this.camera.setup({ canvas, controller: new Controller(canvas) }, () => {
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
