import React from "react";
import { MainState, MainTriggers, CHANCE } from "../Main";
import * as message from "./MessageTypes";
import { messageHandlers } from "./MessageHandlers";

interface pendingRequest {
	creationTime: number;
	sentMessage: message.base;
	messageType: message.kind;
}

export class WebsocketManager {
	readonly setMainState: React.Component<{}, MainState>["setState"];
	readonly mainTriggers: MainTriggers;
	private ws: WebSocket;
	private user = "";
	private pass = "";
	private latencyRTT = Number.MAX_SAFE_INTEGER;
	private readonly pendingRequests = [] as pendingRequest[];

	constructor(setState: React.Component<{}, MainState>["setState"], triggers: MainTriggers) {
		this.setMainState = setState;
		this.mainTriggers = triggers;
		this.ws = this.createSession();
	}

	private createSession() {
		const wsPrefix = window.location.protocol === "https:" ? "wss://" : "ws://";
		const wsURL = `${wsPrefix}${window.location.host}/sync`;
		const ws = new WebSocket(wsURL);
		ws.addEventListener("open", () => {
			ws.addEventListener("message", this.handleMessage);
			ws.addEventListener("error", this.handleError);
			ws.addEventListener("close", this.handleClose);
		});
		return ws;
	}

	private handleMessage(ev: MessageEvent) {
		const baseMsg = JSON.parse(ev.data) as message.base;
		if (baseMsg.messageType === message.kind.Ping) {
			messageHandlers.receivePing(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.GenericError) {
			messageHandlers.receiveGenericError(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.GenericInfo) {
			messageHandlers.receiveGenericInfo(baseMsg);
		} else if (baseMsg.messageType === message.kind.AllSubnets) {
			messageHandlers.receiveAllSubnets(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.SomeSubnets) {
			messageHandlers.receiveSomeSubnets(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.SomeHosts) {
			messageHandlers.receiveSomeHosts(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.SpecificHosts) {
			messageHandlers.receiveSpecificHosts(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.History) {
			messageHandlers.receiveHistory(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.DebugLog) {
			messageHandlers.receiveDebugLog(baseMsg, this);
		} else if (baseMsg.messageType === message.kind.ManualPingScan) {
			messageHandlers.receiveManualPingScan(baseMsg, this);
		} else {
			console.error(`received invalid messageType: ${baseMsg.messageType}`);
		}
	}

	private handleError(ev: Event) {
		return; // do nothing
	}

	private handleClose(ev: CloseEvent) {
		setTimeout(() => {
			this.ws = this.createSession();
		}, CHANCE.floating({ min: 250, max: 750 }));
	}

	sendMessage(request: message.AllKnownOutboundTypes) {
		for (var otherReq of this.findSpecificPendingMessageType(request.messageType)) {
			this.removePendingMessage(otherReq.sentMessage.sessionGUID);
		}
		this.pendingRequests.push({
			creationTime: Date.now(),
			sentMessage: request,
			messageType: request.messageType
		});
		if (this.isConnected()) {
			this.ws.send(JSON.stringify(request));
		} else {
			const interval = setInterval(() => {
				const pendingMessage = this.findPendingMessage(request.sessionGUID);
				if (pendingMessage === undefined) {
					clearInterval(interval);
				} else if (this.isConnected()) {
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
		return this.ws.readyState === this.ws.OPEN;
	}

	getLatencyRTT() {
		return this.latencyRTT;
	}

	getSubnetData() {}

	getUsername() {
		return this.user;
	}

	getPassword() {
		return this.pass;
	}
}
