// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'astro/config';
import config from "./src/config/config.json";

// https://astro.build/config
export default defineConfig({
    site: config.site.base_url ? config.site.base_url : "http://examplesite.com",
    base: config.site.base_path ? config.site.base_path : "/",
    trailingSlash: config.site.trailing_slash ? "always" : "never",
    vite: {
        plugins: [tailwindcss()],
        css: {
            preprocessorOptions: {
                scss: {
                    loadPaths: ['./src/styles'], includePaths: ['./src/styles'],
                }
            }
        }
    },
});
