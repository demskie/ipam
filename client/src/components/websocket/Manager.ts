import React from "react";
import { MainState, MainTriggers, notifications } from "../Main";
import { Subnet } from "../left/SubnetTree";
import { HostData } from "../Right";
import * as message from "./MessageTypes";

import { Intent } from "@blueprintjs/core";

import { Chance } from "chance";
const CHANCE = Chance();

export class WebsocketManager {
	private readonly setMainState: React.Component<{}, MainState>["setState"];
	private readonly mainTriggers: MainTriggers;
	private ws: WebSocket;
	private user = "";
	private pass = "";
	private latencyRTT = -1;
	private pendingRequests = new Map<message.globallyUniqueID, message.base>();

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
		switch (baseMsg.messageType) {
			case message.kind.Ping:
				msg = baseMsg as message.inboundPing;
				// do something
				break;
			case message.kind.GenericError:
				msg = baseMsg as message.inboundGenericError;
				notifications.show({
					intent: Intent.WARNING,
					message: msg.error,
					timeout: 0
				});
				break;

			case message.kind.DisplaySubnetData:
				msg = baseMsg as inboundDisplaySubnetData;
				this.mainTriggers.processCompleteSubnetData(msg.requestData);
			case InboundRequestTypes.DisplayFilteredSubnetData:
				msg = baseMsg as inboundDisplayFilteredSubnetData;
				this.mainTriggers.processFilteredSubnetData(msg.requestData, msg.originalFilter);
			default:
				console.error(`received invalid requestType: ${baseMsg.requestType}`);
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
