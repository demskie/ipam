import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveHistory(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundHistory;
	console.debug("received history:", msg.history)
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		websocketManager.mainTriggers.setMainState({ historyData: msg.history });
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendHistory(websocketManager: WebsocketManager) {
	console.debug("sending history")
	websocketManager.sendMessage({
		messageType: message.kind.History,
		sessionGUID: websocketManager.createSessionGUID()
	});
}
