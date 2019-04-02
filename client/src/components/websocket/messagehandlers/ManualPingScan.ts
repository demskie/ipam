import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function receiveManualPingScan(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundManualPingScan;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		const origMsg = origReq.sentMessage as message.outboundManualPingScan;
		if (origMsg.network === websocketManager.mainTriggers.getScanTarget()) {
			websocketManager.setMainState({ scanData: msg.results });
		}
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendManualPingScan(network: string, websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.ManualPingScan,
		sessionGUID: websocketManager.createSessionGUID(),
		network: network
	});
}
