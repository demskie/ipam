import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function sendModifySubnet(subnetRequest: message.SubnetRequest, websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.ModifySubnet,
		sessionGUID: websocketManager.createSessionGUID(),
		subnetRequest: subnetRequest
	});
}
