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
	lastRequested: number;
	lastUpdated: number;
}

export function receiveManualPingScan(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundManualPingScan;
	console.debug("receiveManualPingScan:", msg)
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		const origMsg = origReq.sentMessage as message.outboundManualPingScan;
		websocketManager.mainTriggers.updateScanTarget(origMsg.network, msg.results);
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendManualPingScan(network: string, websocketManager: WebsocketManager) {
	const net = netparser.network(network);
	console.debug("sendManualPingScan:", net)
	if (net !== null && netparser.baseAddress(network) === netparser.ip(network)) {
		websocketManager.sendMessage({
			messageType: message.kind.ManualPingScan,
			sessionGUID: websocketManager.createSessionGUID(),
			network: net
		});
	}
}

export function createStaleEntries(net: string) {
	const results = [] as ScanEntry[];
	let ip = netparser.ip(net);
	if (!ip) return results;
	let i = 0;
	while (i < 1e5 && netparser.networkContainsAddress(net, ip)) {
		results.push({
			address: ip,
			latency: Number.MAX_SAFE_INTEGER,
			hostname: "",
			lastRequested: 0,
			lastUpdated: Number.MAX_SAFE_INTEGER,
		} as ScanEntry);
		ip = netparser.nextAddress(ip);
		if (!ip) return results;
		i++
	}
	return results;
}

export function getScanTargetPercentage(scanTarget: ScanTarget) {
	let finishedEntries = 0;
	const threeMinutes = 1000 * 60 * 3;
	for (var entry of scanTarget.entries) {
		if (entry.lastRequested < threeMinutes) {
			if (entry.lastUpdated < threeMinutes) {
				finishedEntries++
			}
		} else {
			finishedEntries++
		}
	}
	if (finishedEntries < 1) return 0;
	const desiredLength = Math.min(scanTarget.entries.length, 1e5)
	return Math.max(0.1, Math.min(finishedEntries / desiredLength, 1));
}