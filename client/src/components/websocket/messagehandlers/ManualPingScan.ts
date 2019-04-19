import netparser from "netparser";
import * as message from "../MessageTypes";
import { WebsocketManager } from "../WebsocketManager";

export interface ScanTarget {
	target: string;
	entries: ScanEntry[];
}

export interface ScanEntry {
	address: string;
	latency: number;
	hostname: string;
	isFresh: boolean;
}

export function receiveManualPingScan(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundManualPingScan;
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		const origMsg = origReq.sentMessage as message.outboundManualPingScan;
		if (origMsg.network === websocketManager.mainTriggers.getScanTarget()) {
			websocketManager.setMainState({});
		}
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendManualPingScan(network: string, websocketManager: WebsocketManager) {
	const net = netparser.network(network);
	if (net !== null) {
		websocketManager.mainTriggers.startScanning(net);
		websocketManager.sendMessage({
			messageType: message.kind.ManualPingScan,
			sessionGUID: websocketManager.createSessionGUID(),
			network: net
		});
	}
}

export function createStaleEntries(net: string) {
	const cidr = parseInt(net.split("/")[1], 10);
	const count = Math.pow(2, cidr);
	const results = [];
	let ip = netparser.ip(net);
	for (var i = 0; i < count; i++) {
		results.push({
			address: ip,
			latency: Number.MAX_SAFE_INTEGER,
			hostname: "",
			isFresh: false
		} as ScanEntry);
		ip = netparser.nextAddress(ip);
	}
	return results;
}
