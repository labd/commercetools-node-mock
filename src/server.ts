import { CommercetoolsMock } from "./index.ts";

process.on("SIGINT", () => {
	process.exit();
});

const instance = new CommercetoolsMock({ strict: true });

let port = 3000;

if (process.env.HTTP_SERVER_PORT)
	port = Number.parseInt(process.env.HTTP_SERVER_PORT, 10);

// biome-ignore lint: lint/correctness/noConsoleLog
console.info("Starting commercetools-mock on http://localhost:" + port);
await instance.runServer(port);
