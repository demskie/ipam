import React from "react";
import { MainState, MainTriggers } from "../Main";

export class WebsocketManager {
	private readonly setMainState: React.Component<{}, MainState>["setState"];
	private readonly mainTriggers: MainTriggers;
	private ws: WebSocket;
	private user = "";
	private pass = "";

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
			ws.addEventListener("close", () => setTimeout(this.createSession, 1000));
			this.setMainState({ alertVisible: true });
		});
		return ws;
	}

	isConnected() {
		return false;
	}

	getSubnetData() {
		// do something
	}

	getUsername() {
		return this.user;
	}

	getPassword() {
		return this.pass;
	}
}
