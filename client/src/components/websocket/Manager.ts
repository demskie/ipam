import React from "react";
import { MainState, MainTriggers, notifications } from "../Main";
import { Subnet } from "../left/SubnetTree";
import { HostData } from "../Right";
import * as message from "./MessageTypes";

import { Intent, IToastOptions } from "@blueprintjs/core";

import { Chance } from "chance";
const CHANCE = Chance();

interface pendingRequest {
	date: Date;
	sentMessage: message.base;
}

export class WebsocketManager {
	private readonly setMainState: React.Component<{}, MainState>["setState"];
	private readonly mainTriggers: MainTriggers;
	private ws: WebSocket;
	private user = "";
	private pass = "";
	private latencyRTT = -1;
	private pendingRequests = [] as pendingRequest[];

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
			ws.addEventListener("error", () =>
				setTimeout(() => {
					this.ws = this.createSession();
				}, 250)
			);
			ws.addEventListener("close", () =>
				setTimeout(() => {
					this.ws = this.createSession();
				}, 250)
			);
		});
		return ws;
	}

	private handleMessage(ev: MessageEvent) {
		const baseMsg = JSON.parse(ev.data) as message.base;
		var msg;
		var toasts: IToastOptions[];
		switch (baseMsg.messageType) {
			case message.kind.Ping:
				msg = baseMsg as message.inboundPing;
				for (let req of this.pendingRequests) {
					if (req.sentMessage.sessionGUID === msg.sessionGUID) {
						this.latencyRTT = new Date().getTime() - req.date.getTime();
						break;
					}
				}
				break;
			case message.kind.GenericError:
				msg = baseMsg as message.inboundGenericError;
				for (let req of this.pendingRequests) {
					if (req.sentMessage.sessionGUID === msg.sessionGUID) {
						// do something specific
						break;
					}
				}
				toasts = notifications.getToasts();
				if (toasts.length > 8 && toasts[0].key !== undefined) {
					notifications.dismiss(toasts[0].key);
				}
				notifications.show({
					intent: Intent.DANGER,
					message: msg.errorValue,
					timeout: 0
				});
				break;
			case message.kind.GenericInfo:
				msg = baseMsg as message.inboundGenericInfo;
				toasts = notifications.getToasts();
				if (toasts.length < 8) {
					notifications.show({
						intent: Intent.NONE,
						message: msg.info,
						timeout: 5000
					});
				}
			default:
				console.error(`received invalid messageType: ${baseMsg.messageType}`);
		}
	}

	isConnected() {
		return this.ws.readyState === this.ws.OPEN;
	}

	getSubnetData() {}

	getUsername() {
		return this.user;
	}

	getPassword() {
		return this.pass;
	}
}
