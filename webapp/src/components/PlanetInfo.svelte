<script>
export let planet;
</script>

<style>
.frame label, .frame .value {
  display: inline-block;
}
.frame label {
  min-width: 80px;
}
</style>
<div class="frame" style="background-color:#000000; color: white; opacity: 0.5; position: absolute;">
  <img class="h-16 w-16 rounded-full mx-auto" src="avatar.jpg">
  <div>
    <h2>{planet.location.x},{planet.location.y}</h2>
    {#each Object.keys(planet.stats) as key}
    <div><label>{key}:</label> <span class="value">{planet.stats[key]}</span></div>
    {/each}
  </div>

</div>
