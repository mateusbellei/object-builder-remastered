// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  modules: ["@nuxtjs/tailwindcss", "@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  tailwindcss: {
    exposeConfig: true,
  },
});
