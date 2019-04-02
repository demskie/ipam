import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function sendDeleteSubnet(subnetRequest: message.SubnetRequest, websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.DeleteSubnet,
		sessionGUID: websocketManager.createSessionGUID(),
		subnetRequest: subnetRequest
	});
}
