import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receivePing(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundPing;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		websocketManager.updateLatencyRTT(origReq.creationTime);
	}
}
