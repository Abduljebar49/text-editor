import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";

export default defineConfig({
  plugins: [
    {
      name: "generate-tailwind-css",
      buildStart() {
        console.log("⚙️  Generating Tailwind CSS...");
        execSync("npx @tailwindcss/cli -i ./src/index.css -o ./dist/output.css --minify", {
          stdio: "inherit",
        });
      },
    },
    react(),
    tailwindcss(),
  ],
});
