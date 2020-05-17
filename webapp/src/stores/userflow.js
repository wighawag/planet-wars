import { writable } from "svelte/store";
import { wallet } from "./wallet";
import { BigNumber } from "@ethersproject/bignumber";

function wait(t, v) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), t * 1000);
  });
}

const $data = {
  flow: undefined,
  step: undefined
};
const { subscribe, set } = writable($data);

// let $wallet;
// wallet.subscribe(walletData => {
//   $wallet = walletData;
//   _setStep($data, walletData);
// });

function _set(obj) {
  for (let key of Object.keys(obj)) {
    if ($data[key] && typeof obj[key] === "object") {
      for (let subKey of Object.keys(obj[key])) {
        // TODO recursve
        $data[key][subKey] = obj[key][subKey];
      }
    } else {
      $data[key] = obj[key];
    }
  }
  console.debug("USERFLOW", JSON.stringify($data, null, "  "));
  set($data);
}

// function _setStep($data, $wallet) {
//   // if ($wallet.status)
// }

let dataStore;
export default dataStore = {
  subscribe,
  async cancel() {
    _set({ flow: undefined, step: undefined, data: undefined });
  },
  async acknownledgeSuccess() {
    // TODO automatic ?
    _set({ flow: undefined, step: undefined, data: undefined });
  },
  // CLAIM PLANET VIA STAKE /////////////////////////////////
  async claim_start(planet) {
    if ($data.flow) {
      throw new Error(`flow in progress`);
    }
    await wallet.probeBuiltin();
    _set({ flow: "ClaimFlow", data: { planet }, step: "chooseStake" });
  },
  async claim_confirm(stake) {
    _set({ step: "SendingTx" });
    console.log({ address: wallet.address, location: $data.data.planet.location.id, stake });
    const tx = await wallet.contracts.OuterSpace.stake(
      wallet.address,
      $data.data.planet.location.id,
      BigNumber.from(stake).mul("1000000000000000000")
    );
    _set({ step: "Success", data: { txHash: tx.hash } });
  }
  ///////////////////////////////////////////////////////////
};

if (typeof window !== "undefined") {
  window.userflow = $data;
}
