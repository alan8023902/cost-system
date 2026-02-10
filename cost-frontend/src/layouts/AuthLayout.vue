<template>
  <div class="auth-layout">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// Simple layout for authentication pages (login, forgot password, etc.)
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
