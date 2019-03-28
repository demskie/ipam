import React from "react";
import { MainState, MainTriggers, notifications } from "../Main";

import { Chance } from "chance";
import { Intent } from "@blueprintjs/core";
import { Subnet } from "../left/SubnetTree";

const CHANCE = Chance();

interface baseMessage {
	requestType: InboundRequestTypes;
}

enum InboundRequestTypes {
	DisplayError = "DISPLAYERROR",
	DisplaySubnetData = "DISPLAYSUBNETDATA",
	DisplayFilteredSubnetData = "DISPLAYFILTEREDSUBNETDATA",
	DisplayHostData = "DISPLAYHOSTDATA",
	DisplayHistoryData = "DISPLAYHISTORYDATA",
	DisplayDebugData = "DISPLAYDEBUGDATA",
	DisplayScanData = "DISPLAYSCANDATA",
	DisplaySearchData = "DISPLAYSEARCHDATA"
}

interface inboundDisplayError {
	requestType: InboundRequestTypes.DisplayError;
	originalGUID: string;
	requestData: string;
}

interface inboundDisplaySubnetData {
	requestType: InboundRequestTypes.DisplaySubnetData;
	originalGUID: string;
	requestData: Subnet[];
}

interface inboundDisplayFilteredSubnetData {
	requestType: InboundRequestTypes.DisplaySubnetData;
	originalGUID: string;
	originalFilter: string;
	requestData: Subnet[];
}

export class WebsocketManager {
	private readonly setMainState: React.Component<{}, MainState>["setState"];
	private readonly mainTriggers: MainTriggers;
	private ws: WebSocket;
	private user = "";
	private pass = "";
	private latency = -1;

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
		const baseMsg = JSON.parse(ev.data) as baseMessage;
		var msg;
		switch (baseMsg.requestType) {
			case InboundRequestTypes.DisplayError:
				msg = baseMsg as inboundDisplayError;
				notifications.show({
					intent: Intent.WARNING,
					message: msg.requestData,
					timeout: 0
				});
				break;
			case InboundRequestTypes.DisplaySubnetData:
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
