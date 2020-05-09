import WalletStore from "../node_modules/web3w/src";

export const { wallet, transactions } = WalletStore({ log: console, debug: true });
