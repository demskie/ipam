import React from "react";
import { MainTriggers, CHANCE } from "../Main";
import * as message from "./MessageTypes";
import { messageReceivers, messageSenders } from "./MessageHandlers";
import { isObject } from "util";

interface pendingRequest {
	creationTime: number;
	sentMessage: message.base;
	messageType: message.kind;
}

export class WebsocketManager {
	readonly mainTriggers: MainTriggers;
	private ws?: WebSocket;
	private refreshers: NodeJS.Timeout;
	private user = "";
	private pass = "";
	private latencyRTT = Number.MAX_SAFE_INTEGER;
	private pendingRequests = [] as pendingRequest[];

	constructor(triggers: MainTriggers) {
		this.mainTriggers = triggers;
		this.ws = this.createSession();
		this.refreshers = this.createRefreshers()
		setInterval(() => {
			if (!this.isConnected()) {
				this.ws = this.createSession()
				this.refreshers = this.createRefreshers()
			}
		}, CHANCE.floating({ min: 750, max: 1250}))
	}

	private createSession() {
		const wsPrefix = window.location.protocol === "https:" ? "wss://" : "ws://";
		const wsHost = window.location.host.split(":")[0]
		const wsURL = `${wsPrefix}${wsHost}/sync`;
		console.log(`opening new websocket session: '${wsURL}'`)
		const ws = new WebSocket(wsURL);
		ws.addEventListener("open", () => {
			ws.addEventListener("message", this.handleMessage);
			ws.addEventListener("error", this.handleError);
			ws.addEventListener("close", this.handleClose);
		});
		return ws;
	}

	private createRefreshers = () => {
		const interval = setInterval(() => {
			if (this.isConnected()) {
				messageSenders.sendPing(this);
				messageSenders.sendAllSubnets(this);
			} else {
				this.latencyRTT = Number.MAX_SAFE_INTEGER;
			}
		}, CHANCE.floating({ min: 400, max: 600 }))
		if (this.refreshers) {
			clearInterval(this.refreshers);
		}
		this.refreshers = interval;
		return interval
	}

	private handleMessage = (ev: MessageEvent) => {
		const baseMsg = JSON.parse(ev.data) as message.base;
		if (!isObject(baseMsg) || typeof baseMsg.messageType !== "number") {
			console.error("received an invalid message:", baseMsg);
		} else if (baseMsg.messageType === message.kind.Ping) {
			messageReceivers.receivePing(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.GenericError) {
			messageReceivers.receiveGenericError(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.GenericInfo) {
			messageReceivers.receiveGenericInfo(baseMsg);
		} else if (baseMsg.messageType === message.kind.AllSubnets) {
			messageReceivers.receiveAllSubnets(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.SomeSubnets) {
			messageReceivers.receiveSomeSubnets(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.SomeHosts) {
			messageReceivers.receiveSomeHosts(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.SpecificHosts) {
			messageReceivers.receiveSpecificHosts(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.History) {
			messageReceivers.receiveHistory(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.DebugLog) {
			messageReceivers.receiveDebugLog(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.ManualPingScan) {
			messageReceivers.receiveManualPingScan(baseMsg, this);
		} else {
			console.error(`received an invalid messageType: '${baseMsg.messageType}'`);
		}
	}

	private handleError = (ev: Event) => {}

	private handleClose = (ev: CloseEvent) => {}

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
		return this.ws && (this.ws.readyState === this.ws.OPEN);
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
