import pino from "pino";
import { CommercetoolsMock } from "./index.ts";
import { SQLiteStorage } from "./storage/sqlite.ts";

const enableLogging = process.env.ENABLE_LOGGING === "true";
const experimentalSQLiteStorage =
	process.env.EXPERIMENTAL_SQLITE_STORAGE === "true";

const storage = experimentalSQLiteStorage ? new SQLiteStorage() : undefined;

process.on("SIGINT", () => {
	if (storage) storage.close();
	process.exit();
});

const logger = enableLogging
	? pino({ transport: { target: "pino-pretty" } })
	: undefined;

const instance = new CommercetoolsMock({
	strict: true,
	silent: !enableLogging,
	logger,
	storage,
	// enableAuthentication: true,
	// validateCredentials: true,
});

let port = 3000;

if (process.env.HTTP_SERVER_PORT)
	port = Number.parseInt(process.env.HTTP_SERVER_PORT, 10);

instance.app.log.info(
	`Starting commercetools-mock on http://localhost:${port}`,
);

async function main() {
	await instance.runServer(port);
}

main().catch((error) => {
	// biome-ignore lint/suspicious/noConsole: Fatal startup error must always be visible regardless of logger config
	console.error("Failed to start commercetools-mock server:", error);
	process.exitCode = 1;
});
