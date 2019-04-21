import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveSomeHosts(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundSomeHosts;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		websocketManager.mainTriggers.setMainState({ hostData: msg.hosts });
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendSomeHosts(filter: string, websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.SomeHosts,
		sessionGUID: websocketManager.createSessionGUID(),
		filter: filter
	});
}
