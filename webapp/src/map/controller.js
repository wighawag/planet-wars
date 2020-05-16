import PlanetInfo from "../components/PlanetInfo";

export class Controller {
  constructor(canvas) {
    this.canvas = canvas.parentNode;
    this.planetInfoComponent = null;
  }
  onPlanetSelected(planet) {
    if (planet) {
      this.showPlanetInfo(planet);
    } else {
      this.hidePlanetInfo();
    }
  }

  showPlanetInfo(planet) {
    if (this.planetInfoComponent) {
      this.hidePlanetInfo();
    }
    this.planetInfoComponent = new PlanetInfo({
      target: this.canvas,
      props: {
        planet
      }
    });
  }

  hidePlanetInfo() {
    if (this.planetInfoComponent) {
      this.planetInfoComponent.$destroy();
      this.planetInfoComponent = null;
    }
  }
}
