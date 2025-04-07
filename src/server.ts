import { CommercetoolsMock } from "./index";

process.on("SIGINT", () => {
	console.info("Stopping server...");
	process.exit();
});

const instance = new CommercetoolsMock();

let port = 3000;

if (process.env.HTTP_SERVER_PORT)
	port = Number.parseInt(process.env.HTTP_SERVER_PORT);

instance.runServer(port);
