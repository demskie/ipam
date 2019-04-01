import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveDebugLog(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundDebugLog;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		websocketManager.setMainState({ debugData: msg.debugLog });
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendDebugLog(websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.DebugLog,
		sessionGUID: websocketManager.createSessionGUID()
	});
}
