import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receivePing(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundPing;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		if (msg.demoMode) {
			websocketManager.mainTriggers.enableDemoMode()
		}
		websocketManager.updateLatencyRTT(origReq.creationTime);
	}
}

export function sendPing(websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.Ping,
		sessionGUID: websocketManager.createSessionGUID()
	});
}
