<script>
  import { wallet } from "../stores/wallet";
  import userflow from "../stores/userflow";
	import Modal from '../components/Modal.svelte';

  $: planet = $userflow.data.planet;
  $: location = planet.location;
  $: stats = planet.stats;

  let stake = $userflow.data.planet.stats.maxStake;
</script>

{#if $wallet.status === "Ready"}

{#if $wallet.chain.status === "Ready"}
<Modal on:close="{() => userflow.cancel()}" confirmButton="Confirm" on:confirm="{() => userflow.claim_confirm(stake)}">
  <h2 slot="header">
   Claim Planet {location.x},{location.y}
  </h2>

  <p>How much stake?</p>

  <div>
    <!-- TODO show DAI balance and warn when cannot buy // DAI balance could be shown in navbar (once connected)-->
    <input type="range" id="stake" name="stake" bind:value="{stake}" min="1" max="{stats.maxStake}">
    <label for="stake">Stake</label>
    <input type="text" id="textInput" value="{stake}">
  </div>
</Modal>
{:else}
<Modal on:close="{() => userflow.cancel()}">loading chain</Modal>
{/if}
<!-- TODO wrong chain -->

{:else if $wallet.status === "Loading"}
<Modal on:close="{() => userflow.cancel()}">loading</Modal>
{:else if $wallet.status === "Locked"}
<Modal on:close="{() => userflow.cancel()}">locked</Modal>
{:else if !$wallet.builtin}
<Modal on:close="{() => userflow.cancel()}">Error probe need to be called</Modal>
{:else if $wallet.builtin.status === "None"} <!-- assume probe was called-->
<Modal on:close="{() => userflow.cancel()}">No Wallet</Modal>
{:else}
<Modal on:close="{() => userflow.cancel()}" confirmButton="builtin", on:confirm="{() => wallet.connect('builtin')}">Chose wallet</Modal>
{/if}
