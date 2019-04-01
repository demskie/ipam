import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveSomeSubnets(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundSomeSubnets;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		websocketManager.setMainState({ subnetData: msg.subnets });
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}
