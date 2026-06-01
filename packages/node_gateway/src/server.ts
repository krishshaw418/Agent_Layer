import { WebSocketServer } from "ws";
import { config } from "./config";
import { typeSchema, apiKeySchema } from "./schema";
import { isAddress } from "ethers";
import { isClientVerified } from "./utils";

export const createWebSocketServer = () => {
    const wsServer = new WebSocketServer({
        host: '127.0.0.1',
        port: config.port,
        verifyClient: async (info, cb) => {

            const isSecure = info.secure || info.req.headers['x-forwarded-proto'] === 'https';
            if (!isSecure) {
                return cb(false, 401, "Insecure connection!");
            }

            const fullUrl = 'http://' + info.req.headers.host + info.req.url;
            const { searchParams } = new URL(fullUrl);
            const parsedClientType = typeSchema.safeParse(searchParams.get('type'));

            if (!parsedClientType.success) {
                return cb(false, 401, 'Invalid user type!');
            }

            const authHeader = info.req.headers.authorization;
            if (!authHeader?.startsWith("Bearer ")) {
                console.log("Error in authHeader!");
                return cb(false, 401, "Missing or invalid Authorization header!");
            }

            const parsedApiKey = apiKeySchema.safeParse(authHeader.slice(7));

            if (!parsedApiKey.success) {
                return cb(false, 401, 'Missing or invalid api key!');
            }

            const isVerified = await isClientVerified(parsedApiKey.data);

            if (!isVerified) {
                return cb(false, 401, 'Invalid api key or provided api key revoked!');
            }

            if (parsedClientType.data === "node") {
                const nodeId = searchParams.get('nodeId');
                if (!nodeId) {
                    return cb(false, 401, 'Missing nodeId!');
                }
                const isValid = isAddress(nodeId);
                if (!isValid) {
                    return cb(false, 401, 'Invalid node address!');
                }
            }
            return cb(true);
        }
    });

    return wsServer;
}