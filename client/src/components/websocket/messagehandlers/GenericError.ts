import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";
import { notifications } from "../../Main";

export function receiveGenericError(baseMsg: message.base, websocketManager: WebsocketManager) {
	console.log("websocketManager:", websocketManager)
	const msg = baseMsg as message.inboundGenericError;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		// do something specific
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	} else {
		const toasts = notifications.getToasts();
		if (toasts.length > 8 && toasts[0].key !== undefined) {
			notifications.dismiss(toasts[0].key);
		}
		notifications.show({
			intent: "danger",
			message: msg.errorValue,
			timeout: 0
		});
	}
}
