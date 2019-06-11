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
	timeSinceUpdate: number;
	isConfirmed: boolean;
}

export function receiveManualPingScan(baseMsg: message.base, websocketManager: WebsocketManager) {
	const msg = baseMsg as message.inboundManualPingScan;
	console.debug("receiveManualPingScan:", msg);
	const origReq = websocketManager.findPendingMessage(msg.sessionGUID);
	if (origReq !== undefined) {
		const origMsg = origReq.sentMessage as message.outboundManualPingScan;
		websocketManager.mainTriggers.updateScanTarget(origMsg.aggregate, msg.results);
		websocketManager.removePendingMessage(origReq.sentMessage.sessionGUID);
	}
}

export function sendManualPingScan(aggregate: string, networks: null | string[], websocketManager: WebsocketManager) {
	const agg = netparser.network(aggregate);
	if (!agg) {
		console.error(`sendManualPingScan() '${aggregate}' is not a valid network`);
		return;
	}
	const nets = [] as string[];
	if (networks) {
		for (let network of networks) {
			const net = netparser.network(network);
			if (net && netparser.baseAddress(net) === netparser.ip(network)) {
				if (netparser.networkContainsSubnet(agg, net)) {
					nets.push(net);
				}
			}
		}
	} else {
		nets.push(agg);
	}
	const summarized = netparser.summarize(nets);
	if (summarized && summarized.length > 0) {
		console.debug("sendManualPingScan:", summarized);
		websocketManager.sendMessage({
			messageType: message.kind.ManualPingScan,
			sessionGUID: websocketManager.createSessionGUID(),
			aggregate: agg,
			networks: summarized
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
			timeSinceUpdate: Number.MAX_SAFE_INTEGER,
			isConfirmed: false
		} as ScanEntry);
		ip = netparser.nextAddress(ip);
		if (!ip) return results;
		i++;
	}
	return results;
}

export function getScanTargetPercentage(scanTarget: ScanTarget) {
	let finishedEntries = 0;
	const threeMinutes = 1000 * 60 * 3;
	for (var entry of scanTarget.entries) {
		if (entry.isConfirmed || entry.timeSinceUpdate < threeMinutes) {
			finishedEntries++;
		}
	}
	if (finishedEntries < 1) return 0;
	const desiredLength = Math.min(scanTarget.entries.length, 1e5);
	return Math.max(0.1, Math.min(finishedEntries / desiredLength, 1));
}

export function getUnscannedNetworks(scanTarget: ScanTarget) {
	const unscanned = [] as string[];
	const threeMinutes = 1000 * 60 * 3;
	for (var entry of scanTarget.entries) {
		if (entry.isConfirmed || entry.timeSinceUpdate < threeMinutes) {
			unscanned.push(entry.address);
		}
	}
	return netparser.summarize(unscanned);
}

export function getMergedEntries(oldEntries: ScanEntry[], newEntries: ScanEntry[]) {
	const hashMap = new Map() as Map<string, ScanEntry>;
	for (let oldEntry of oldEntries) {
		hashMap.set(oldEntry.address, oldEntry);
	}
	const threeMinutes = 1000 * 60 * 3;
	for (var newEntry of newEntries) {
		const oldEntry = hashMap.get(newEntry.address);
		if (!oldEntry || !oldEntry.isConfirmed) {
			if (newEntry.timeSinceUpdate < threeMinutes) {
				newEntry.isConfirmed = true;
			} else {
				newEntry.isConfirmed = false;
			}
			hashMap.set(newEntry.address, newEntry);
		}
	}
	let i = 0;
	const mergedEntries = new Array(hashMap.size) as ScanEntry[];
	for (let scanEntry of hashMap.values()) {
		mergedEntries[i++] = scanEntry;
	}
	return mergedEntries;
}
