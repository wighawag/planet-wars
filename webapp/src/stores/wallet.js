import WalletStore from "../node_modules/web3w/src";
import contractsInfo from "../dev_contractsInfo.json";

export const { wallet, transactions } = WalletStore({
  log: console,
  debug: true,
  chainConfigs: contractsInfo,
  builtin: { autoProbe: true, metamaskReloadFix: true }
});
