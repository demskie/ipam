import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveSpecificHosts(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundSpecificHosts;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		if (!msg.hosts.customData) {
			msg.hosts.customData = []
		}
		websocketManager.mainTriggers.setMainState({ hostData: msg.hosts });
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendSpecificHosts(network: string, websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.SpecificHosts,
		sessionGUID: websocketManager.createSessionGUID(),
		network: network
	});
}
