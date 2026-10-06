import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  base: "./",
  build: {
    target: "es2022",
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
