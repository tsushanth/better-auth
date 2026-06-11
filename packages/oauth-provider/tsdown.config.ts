import { defineConfig } from "tsdown";

export default defineConfig({
	dts: { build: true, incremental: true },
	format: ["esm"],
	entry: [
		"./src/index.ts",
		"./src/client.ts",
		"./src/client-resource.ts",
		"./src/mcp/index.ts",
		"./src/mcp/client/index.ts",
		"./src/mcp/client/adapters.ts",
	],
	treeshake: true,
	clean: true,
});
