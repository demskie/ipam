import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveSpecificHosts(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundSpecificHosts;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		websocketManager.setMainState({ hostData: msg.hosts });
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}
