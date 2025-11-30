import { CommercetoolsMock } from "./index.ts";

process.on("SIGINT", () => {
	process.exit();
});

const instance = new CommercetoolsMock();

let port = 3000;

if (process.env.HTTP_SERVER_PORT)
	port = Number.parseInt(process.env.HTTP_SERVER_PORT, 10);

instance.runServer(port);
