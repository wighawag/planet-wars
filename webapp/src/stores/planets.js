import { writable } from "svelte/store";
import { client, PLANETS, PLANETS_SUBSCRIPTION } from "../graphql";
import { BigNumber } from "@ethersproject/bignumber";
import { locationToXY} from "../../../contracts/lib/outerspace";

function wait(t, v) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), t * 1000);
  });
}

const $data = {};
const { subscribe, set } = writable($data);

function _set(data) {
  // TODO remove:
  console.log(data);
  Object.assign($data, data);
  set($data);
}

function transform(acquiredPlanets) {
  const planets = {};
  for (const planet of acquiredPlanets) {
    const { x, y } = locationToXY(planet.id);
    planets[`${x},${y}`] = planet;
  }
  return planets;
}

async function listen() {
  if (!process.browser) {
    return;
  }
  if ($data.listenning) {
    return;
  }
  _set({ listenning: true });

  if ($data.status !== "loaded") {
    _set({ status: "loading" });
  }

  // TODO handle error

  let sub = await client.subscribe({
    query: PLANETS_SUBSCRIPTION
  });
  // let sub = await client.watchQuery({
  //     query: PLANETS,
  //     pollInterval : 1000
  // });

  sub.subscribe({
    next: result => _set({ status: "loaded", data: transform(result.data.acquiredPlanets) }),
    error: (...args) => console.log("error", ...args),
    complete: (...args) => console.log("complete", ...args)
  });
}

let dataStore;
export default dataStore = {
  subscribe,
  load: async () => {
    if ($data.status !== "loaded") {
      _set({ status: "loading" });
    }
    const result = await client.query({
      query: PLANETS,
      fetchPolicy: process.browser ? undefined : "network-only"
    });
    console.log({ result: JSON.stringify(result, null, "  ") });
    _set({ status: "loaded", data: transform(result.data.acquiredPlanets) });
    return { data: result.data };
  },
  boot: data => {
    if (data) {
      client.writeQuery({ query: PLANETS, data });
      _set({ status: "loaded", data: transform(data.acquiredPlanets) });
    }
    listen();
  },
  listen
};

if (typeof window !== "undefined") {
  window.planets = $data;
}
