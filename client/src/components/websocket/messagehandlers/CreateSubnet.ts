import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export function sendCreateSubnet(subnetRequest: message.SubnetRequest, websocketManager: WebsocketManager) {
	websocketManager.sendMessage({
		messageType: message.kind.CreateSubnet,
		sessionGUID: websocketManager.createSessionGUID(),
		subnetRequest: subnetRequest
	});
}
