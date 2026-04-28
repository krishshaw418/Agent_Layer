import { AccountResource } from "../resource/account";
import { ChatResource } from "../resource/chat";
import { EmbeddingResource } from "../resource/embeddings";
import { TokenResource } from "../resource/tokens";

export class AgentLayerClient {
    apiKey: string;
    baseUrl: string;
    chat: ChatResource;
    embeddings: EmbeddingResource;
    account: AccountResource;
    token: TokenResource;

    constructor(apiKey: string, baseUrl: string = "https://api.agentlayer.ai") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.chat = new ChatResource(this);
        this.embeddings = new EmbeddingResource(this);
        this.account = new AccountResource(this);
        this.token = new TokenResource(this);
    }
}