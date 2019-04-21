import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveSomeSubnets(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundSomeSubnets;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		websocketManager.mainTriggers.setMainState({ subnetData: msg.subnets });
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendSomeSubnets(filter: string, websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.SomeSubnets,
		sessionGUID: websocketManager.createSessionGUID(),
		filter: filter
	});
}
