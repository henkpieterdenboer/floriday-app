import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],

    /**
     * Testbestanden draaien na elkaar in plaats van tegelijk.
     *
     * De integratietests praten allemaal tegen dezelfde Neon-database. Parallel gaf dat
     * een flake: tests/integration/no-real-data-touched.test.ts telt rijen met een
     * testvoorvoegsel en verwacht er nul, maar zag er soms 25 - namelijk die van een ander
     * bestand dat op dat moment halverwege zijn eigen opruimstap was. Geen echt probleem
     * met de data, wel een test die willekeurig faalt, en dat is erger dan geen test:
     * het went, en dan valt een echte fout ook niet meer op.
     *
     * De hele suite duurt sequentieel ongeveer twintig seconden, dus de prijs is laag.
     * Wie dit ooit terugdraait, moet de integratietests eerst een eigen database geven.
     */
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
