import { WebSocketServer } from "ws";
import { config } from "./config";
import { typeSchema } from "./schema";
import { isAddress } from "ethers";
export const createWebSocketServer = () => {
    const wsServer = new WebSocketServer({
        host: '127.0.0.1',
        port: config.port,
        verifyClient: (info, cb) => {

            const isSecure = info.secure || info.req.headers['x-forwarded-proto'] === 'https';
            if (!isSecure) {
                return cb(false, 401, "Insecure connection!");
            }

            const fullUrl = 'http://' + info.req.headers.host + info.req.url;
            const { searchParams } = new URL(fullUrl);
            const parsed = typeSchema.safeParse(searchParams.get('type'));

            if (!parsed.success) {
                return cb(false, 401, 'Invalid user type!');
            } else {
                if (parsed.data === "node") {
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
        }
    });

    return wsServer;
}