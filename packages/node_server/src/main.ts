import { config } from "./config";
import { createServer } from "./server";

async function main() {
    const app = await createServer();

    const port = config.port;
    app.listen(port, () => {
        console.log(`Node server listening at port: ${port}`);
    })
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
})