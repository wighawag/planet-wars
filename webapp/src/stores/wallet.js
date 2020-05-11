import WalletStore from "../node_modules/web3w/src";
import contractsInfo from "../dev_contractsInfo.json";

const { wallet, transactions } = WalletStore({
  log: console,
  debug: true,
  chainConfigs: contractsInfo,
  builtin: { autoProbe: true, metamaskReloadFix: true }
});

// TODO remove
if (typeof window !== "undefined") {
  console.log('adding to global');
  window.wallet = wallet;
  window.transactions = transactions;
}

export { wallet, transactions };
