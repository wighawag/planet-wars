<script>
export let planet;
import planets from "../stores/planets";
import userflow from "../stores/userflow";

$: planetAcquired = $planets.data[`${planet.location.x},${planet.location.y}`];
</script>

<style>
.frame label, .frame .value {
  display: inline-block;
}
.frame label {
  min-width:110px;
}
</style>
<div class="frame" style="background-color:#000000; color: white; opacity: 0.5; position: absolute;">
  <!-- <img class="h-16 w-16 rounded-full mx-auto" src="avatar.jpg"> -->
  <div>
    <h2>Planet {planet.location.x},{planet.location.y}</h2>
    <div><label>maxStake:</label> <span class="value">{planet.stats.maxStake}</span></div>
    <div><label>maxProduction:</label> <span class="value">{planet.stats.production}</span></div>
    <div><label>attack:</label> <span class="value">{planet.stats.attack}</span></div>
    <div><label>defense:</label> <span class="value">{planet.stats.defense}</span></div>
    <div><label>speed:</label> <span class="value">{planet.stats.speed}</span></div>
    {#if planetAcquired}
    <div><label>owner:</label> <span class="value">{planetAcquired.owner}</span></div>
    <div><label>ownerTime:</label> <span class="value">{planetAcquired.lastOwnershipTime}</span></div>    
    <div><label>stake:</label> <span class="value">{planetAcquired.stake}</span></div>
    <div><label>production:</label> <span class="value">{planetAcquired.productionRate}</span></div>
    <div><label>spaceships:</label> <span class="value">{planetAcquired.numSpaceships}</span></div>
    <div><label>lastUpdated:</label> <span class="value">{planetAcquired.lastUpdated}</span></div>
    {:else}
    <div><label>natives:</label> <span class="value">{planet.stats.natives}</span></div>
    <button on:click="{() => userflow.claim_start(planet)}"> CLAIM </button>
    {/if}
  </div>

</div>
