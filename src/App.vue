<template>
  <div id="app" class="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

body {
  background-color: #f5f5f5;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
