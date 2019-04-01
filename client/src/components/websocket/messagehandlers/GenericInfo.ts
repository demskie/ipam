import * as message from "../MessageTypes";
import { notifications } from "../../Main";

export function receiveGenericInfo(baseMsg: message.base) {
	const msg = baseMsg as message.inboundGenericInfo;
	const toasts = notifications.getToasts();
	if (toasts.length < 8) {
		notifications.show({
			intent: "none",
			message: msg.info,
			timeout: 5000
		});
	}
}
