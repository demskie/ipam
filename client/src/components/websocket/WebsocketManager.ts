import { MainTriggers, CHANCE } from "../Main";
import * as message from "./MessageTypes";
import { messageReceivers, messageSenders } from "./MessageHandlers";
import { isObject } from "util";
import { getScanTargetPercentage } from "./messagehandlers/ManualPingScan";

interface pendingRequest {
	creationTime: number;
	sentMessage: message.base;
	messageType: message.kind;
}

export class WebsocketManager {
	readonly mainTriggers: MainTriggers;
	private ws?: WebSocket;
	private backgroundTasks: NodeJS.Timeout;
	private scannerTask: NodeJS.Timeout;
	private user = "";
	private pass = "";
	private latencyRTT = Number.MAX_SAFE_INTEGER;
	private pendingRequests = [] as pendingRequest[];

	constructor(triggers: MainTriggers) {
		this.mainTriggers = triggers;
		this.ws = this.createSession();
		this.backgroundTasks = this.createBackgroundTasks();
		this.scannerTask = this.createScannerTask();
		setInterval(() => {
			if (!this.isConnected()) {
				this.ws = this.createSession();
				this.backgroundTasks = this.createBackgroundTasks();
				this.scannerTask = this.createScannerTask();
			}
		}, CHANCE.floating({ min: 750, max: 1250 }));
	}

	private createSession() {
		const wsPrefix = window.location.protocol === "https:" ? "wss://" : "ws://";
		const wsHost = window.location.host.split(":")[0];
		const wsURL = `${wsPrefix}${wsHost}/sync`;
		console.log(`opening new websocket session: '${wsURL}'`);
		const ws = new WebSocket(wsURL);
		ws.addEventListener("open", () => {
			ws.addEventListener("message", this.handleMessage);
			ws.addEventListener("error", this.handleError);
			ws.addEventListener("close", this.handleClose);
		});
		return ws;
	}

	private createBackgroundTasks = () => {
		const interval = setInterval(() => {
			if (this.isConnected()) {
				messageSenders.sendPing(this);
				messageSenders.sendAllSubnets(this);
			} else {
				this.latencyRTT = Number.MAX_SAFE_INTEGER;
			}
		}, CHANCE.floating({ min: 3000, max: 3250 }));
		if (this.backgroundTasks) clearInterval(this.backgroundTasks);
		this.backgroundTasks = interval;
		return interval;
	};

	private createScannerTask = () => {
		const interval = setInterval(() => {
			if (this.isConnected()) {
				const scanTargets = this.mainTriggers.getScanTargets();
				for (var scanTarget of scanTargets) {
					if (getScanTargetPercentage(scanTarget) < 1) {
						messageSenders.sendManualPingScan(scanTarget.target, this);
					}
				}
			}
		}, CHANCE.floating({ min: 750, max: 1000 }));
		if (this.scannerTask) clearInterval(this.scannerTask);
		this.scannerTask = interval;
		return interval;
	};

	private handleMessage = (ev: MessageEvent) => {
		const baseMsg = JSON.parse(ev.data) as message.base;
		if (!isObject(baseMsg) || typeof baseMsg.messageType !== "number") {
			console.error("received an invalid message:", baseMsg);
		} else {
			switch (baseMsg.messageType) {
				case message.kind.Ping:
					messageReceivers.receivePing(baseMsg, this);
					break;
				case message.kind.GenericError:
					messageReceivers.receiveGenericError(baseMsg, this);
					break;
				case message.kind.GenericInfo:
					messageReceivers.receiveGenericInfo(baseMsg);
					break;
				case message.kind.AllSubnets:
					messageReceivers.receiveAllSubnets(baseMsg, this);
					break;
				case message.kind.SomeHosts:
					messageReceivers.receiveSomeHosts(baseMsg, this);
					break;
				case message.kind.SpecificHosts:
					messageReceivers.receiveSpecificHosts(baseMsg, this);
					break;
				case message.kind.History:
					messageReceivers.receiveHistory(baseMsg, this);
					break;
				case message.kind.DebugLog:
					messageReceivers.receiveDebugLog(baseMsg, this);
					break;
				case message.kind.ManualPingScan:
					messageReceivers.receiveManualPingScan(baseMsg, this);
					break;
				default:
					console.error(`received an invalid messageType: '${baseMsg.messageType}'`);
			}
		}
	};

	private handleError = (ev: Event) => {};

	private handleClose = (ev: CloseEvent) => {};

	sendMessage(request: message.AllKnownOutboundTypes) {
		for (var otherReq of this.findSpecificPendingMessageType(request.messageType)) {
			this.removePendingMessage(otherReq.sentMessage.sessionGUID);
		}
		this.pendingRequests.push({
			creationTime: Date.now(),
			sentMessage: request,
			messageType: request.messageType
		});
		if (this.ws && this.isConnected()) {
			this.ws.send(JSON.stringify(request));
		} else {
			const interval = setInterval(() => {
				const pendingMessage = this.findPendingMessage(request.sessionGUID);
				if (pendingMessage === undefined) {
					clearInterval(interval);
				} else if (this.ws && this.isConnected()) {
					this.ws.send(JSON.stringify(request));
					clearInterval(interval);
				}
			}, CHANCE.floating({ min: 400, max: 600 }));
		}
	}

	updateLatencyRTT(lastReqDate: number) {
		this.latencyRTT = Date.now() - lastReqDate;
	}

	findPendingMessage(sessionGUID: string) {
		for (var req of this.pendingRequests) {
			if (req.sentMessage.sessionGUID === sessionGUID) {
				return req;
			}
		}
	}

	createSessionGUID() {
		var guid = CHANCE.guid();
		while (this.findPendingMessage(guid) !== undefined) {
			guid = CHANCE.guid();
		}
		return guid;
	}

	findSpecificPendingMessageType(messageType: message.kind) {
		const arr = [] as pendingRequest[];
		for (var req of this.pendingRequests) {
			if (req.sentMessage.messageType === messageType) {
				arr.push(req);
			}
		}
		return arr;
	}

	removePendingMessage(sessionGUID: string) {
		for (var i = 0; i < this.pendingRequests.length; i++) {
			if (this.pendingRequests[i].sentMessage.sessionGUID === sessionGUID) {
				this.pendingRequests.splice(i, 1);
			}
		}
	}

	isConnected() {
		return this.ws && this.ws.readyState === this.ws.OPEN;
	}

	getLatencyRTT() {
		return Math.min(this.latencyRTT, 9999);
	}

	getUsername() {
		return this.user;
	}

	getPassword() {
		return this.pass;
	}
}
