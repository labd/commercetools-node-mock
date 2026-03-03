import { CommercetoolsMock } from "./index.ts";
import { SQLiteStorage } from "./storage/sqlite.ts";

const storage = new SQLiteStorage();

process.on("SIGINT", () => {
	storage.close();
	process.exit();
});

const enableLogging = process.env.ENABLE_LOGGING === "true";

const instance = new CommercetoolsMock({
	strict: true,
	silent: !enableLogging,
	storage,
	// enableAuthentication: true,
	// validateCredentials: true,
});

let port = 3000;

if (process.env.HTTP_SERVER_PORT)
	port = Number.parseInt(process.env.HTTP_SERVER_PORT, 10);

// biome-ignore lint: lint/correctness/noConsoleLog
console.info("Starting commercetools-mock on http://localhost:" + port);

async function main() {
	await instance.runServer(port);
}

main().catch((error) => {
	// biome-ignore lint/suspicious/noConsole: needed for server startup error reporting
	console.error("Failed to start commercetools-mock server:", error);
	process.exitCode = 1;
});
