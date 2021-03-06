import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveAllSubnets(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundAllSubnets;
	console.debug("received allSubnets:", msg)
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		if (websocketManager.mainTriggers.searchFieldIsEmpty()) {
			websocketManager.mainTriggers.setMainState({ subnetData: msg.subnets });
		}
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendAllSubnets(websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.AllSubnets,
		sessionGUID: websocketManager.createSessionGUID()
	});
}
