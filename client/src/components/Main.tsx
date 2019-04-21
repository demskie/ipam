import React from "react";

import _ from "lodash-es";
import Sidebar from "react-sidebar";
import { Toaster, Position, Intent, Colors } from "@blueprintjs/core";

import { UAParser } from "ua-parser-js";
export const parser = new UAParser();

import { Chance } from "chance";
export const CHANCE = new Chance();

import { Top } from "./Top";
import { Left } from "./Left";
import { Right, HostData } from "./Right";
import { BasicTextOverlay, BasicTextOverlayMode } from "./BasicTextOverlay";
import { SubnetPromptMode } from "./left/SubnetPrompt";
import { WebsocketManager } from "./websocket/WebsocketManager";
import { Subnet } from "./left/SubnetTree";
import { SubnetRequest } from "./websocket/MessageTypes";
import { messageSenders } from "./websocket/MessageHandlers";
import { ScanTarget, createStaleEntries, ScanEntry } from "./websocket/messagehandlers/ManualPingScan";

export const rootElement = document.getElementById("root") as HTMLElement;
const sidebarWidth = 530;

const isOSX = parser.getOS().name === "Mac OS";
const isMobile = parser.getDevice().type === "mobile";
const isTablet = parser.getDevice().type === "tablet";

export const notifications = Toaster.create({
	autoFocus: false,
	canEscapeKeyClear: false,
	className: "bp3-dark",
	position: Position.BOTTOM
});

export class MainState {
	readonly websocket: WebsocketManager;

	sidebarOpen = false;
	sidebarDocked = false;

	darkMode = isOSX || isMobile || isTablet;
	allowNotifications = true;
	cacheLogin = true;

	emptySearchField = true;
	lastTransmittedSearchQuery = "";
	lastReceivedSearchResult = "";

	subnetData = [] as Subnet[];
	selectedTreeNode = {} as Subnet;
	rootSubnetPromptMode = SubnetPromptMode.CLOSED;

	hostData = require("../mockdata/hosts.json") as HostData;
	hostDetailsWidth = 0;
	hostDetailsHeight = 0;

	historyData = require("../mockdata/ipsum.json") as string[];
	debugData = require("../mockdata/ipsum.json") as string[];

	scanTargets = [] as ScanTarget[];

	basicTextOverlayMode = BasicTextOverlayMode.CLOSED;
	basicTextOverlayWidth = 0;
	basicTextOverlayHeight = 0;

	readonly triggers = {} as MainTriggers;

	constructor() {
		this.websocket = new WebsocketManager(this.triggers);
	}
}

export class Main extends React.Component<{}, MainState> {
	state = new MainState();

	componentDidMount() {
		window.addEventListener("resize", _.debounce(this.updateDimensions, 1000));
		this.updateDimensions();
		this.watchForOutdatedCache();
		this.displaySidebarOnce();
		this.attachTriggers();
	}

	updateDimensions = () => {
		let dockedBool;
		if (sidebarWidth <= rootElement.clientWidth / 3) {
			dockedBool = true;
		} else {
			dockedBool = false;
		}
		let tableWidth = rootElement.clientWidth;
		if (dockedBool) {
			tableWidth -= sidebarWidth;
		}
		this.setState({
			sidebarDocked: dockedBool,
			hostDetailsWidth: tableWidth,
			hostDetailsHeight: rootElement.clientHeight - 50,
			basicTextOverlayWidth: rootElement.clientWidth * 0.8,
			basicTextOverlayHeight: rootElement.clientHeight * 0.8
		});
	};

	watchForOutdatedCache = () => {
		const interval = setInterval(() => {
			if ((window as any).isOutdated === true) {
				notifications.show({
					action: {
						onClick: () => window.location.reload(true),
						text: "Refresh"
					},
					icon: undefined,
					intent: Intent.SUCCESS,
					message: "New content is available; please refresh.",
					timeout: 0
				});
				clearInterval(interval);
			}
		}, 1000);
	};

	displaySidebarOnce = () => {
		if (this.state.sidebarDocked === false) {
			setTimeout(() => {
				this.setState({
					sidebarOpen: true
				});
			}, 3000);
		}
	};

	render() {
		return (
			<React.Fragment>
				<Sidebar
					sidebarId={"sidebar"}
					contentId={"content"}
					overlayId={"sidebarOverlay"}
					open={this.state.sidebarOpen}
					docked={this.state.sidebarDocked}
					onSetOpen={(open: boolean) => {
						this.setState({ sidebarOpen: open });
					}}
					styles={{
						sidebar: {
							width: `${sidebarWidth}px`,
							backgroundColor: this.state.darkMode ? "#30404D" : Colors.GRAY5,
							overflowX: "hidden",
							overflowY: "hidden"
						}
					}}
					sidebar={<Left {...this.state} />}
				>
					{
						<React.Fragment>
							<Top {...this.state} />
							<Right
								darkMode={this.state.darkMode}
								hostData={this.state.hostData}
								hostDetailsWidth={this.state.hostDetailsWidth}
								hostDetailsHeight={this.state.hostDetailsHeight}
							/>
						</React.Fragment>
					}
				</Sidebar>
				<BasicTextOverlay {...this.state} />
			</React.Fragment>
		);
	}

	attachTriggers = () => {
		this.state.triggers.toggleDarkMode = () => {
			this.setState({ darkMode: !this.state.darkMode });
		};
		this.state.triggers.toggleNotifications = () => {
			this.setState({ allowNotifications: !this.state.allowNotifications });
		};
		this.state.triggers.toggleLoginCache = () => {
			this.setState({ cacheLogin: !this.state.cacheLogin });
		};
		this.state.triggers.toggleSidebar = () => {
			if (!this.state.sidebarDocked) {
				this.setState({ sidebarOpen: !this.state.sidebarOpen });
			} else {
				this.setState({ sidebarOpen: true });
			}
		};
		this.state.triggers.selectTreeNode = (node: Subnet) => {
			this.setState({ selectedTreeNode: node });
		};
		this.state.triggers.setRootSubnetPromptMode = (mode: SubnetPromptMode) => {
			this.setState({ rootSubnetPromptMode: mode });
		};
		this.state.triggers.getUsername = () => {
			return this.state.websocket.getUsername();
		};
		this.state.triggers.getPassword = () => {
			return this.state.websocket.getPassword();
		};
		this.state.triggers.createSubnet = (subnetRequest: SubnetRequest) => {
			messageSenders.sendCreateSubnet(subnetRequest, this.state.websocket);
		};
		this.state.triggers.modifySubnet = (subnetRequest: SubnetRequest) => {
			messageSenders.sendModifySubnet(subnetRequest, this.state.websocket);
		};
		this.state.triggers.deleteSubnet = (subnetRequest: SubnetRequest) => {
			messageSenders.sendDeleteSubnet(subnetRequest, this.state.websocket);
		};
		this.state.triggers.setBasicTextOverlayMode = (mode: BasicTextOverlayMode) => {
			this.setState({ basicTextOverlayMode: mode });
		};
		this.state.triggers.startScanning = (net: string) => {
			for (var t of this.state.scanTargets) {
				if (t.target === net) return;
			}
			const st = {
				target: net,
				entries: createStaleEntries(net)
			} as ScanTarget;
			const arr = [st, ...this.state.scanTargets.slice(0, 7)];
			this.setState({ scanTargets: arr }, () => {
				messageSenders.sendManualPingScan(net, this.state.websocket);
			});
		};
		this.state.triggers.updateScanTarget = (net: string, results: ScanEntry[]) => {
			const arr = [...this.state.scanTargets];
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].target === net) {
					arr[i].entries = results;
					this.setState({ scanTargets: arr });
					return;
				}
			}
		};
		this.state.triggers.setMainState = (state: any) => {
			this.setState(state);
		};
		this.state.triggers.setSubnetData = (subnetData: Subnet[]) => {};
	};
}

export interface MainTriggers {
	toggleDarkMode: () => void;
	toggleNotifications: () => void;
	toggleLoginCache: () => void;
	toggleSidebar: () => void;
	selectTreeNode: (node: Subnet) => void;
	setRootSubnetPromptMode: (mode: SubnetPromptMode) => void;
	getUsername: () => string;
	getPassword: () => string;
	createSubnet: (subnetRequest: SubnetRequest) => void;
	modifySubnet: (subnetRequest: SubnetRequest) => void;
	deleteSubnet: (subnetRequest: SubnetRequest) => void;
	setBasicTextOverlayMode: (mode: BasicTextOverlayMode) => void;
	startScanning: (net: string) => void;
	updateScanTarget: (net: string, entries: ScanEntry[]) => void;
	setMainState: React.Component<{}, MainState>["setState"];
	setSubnetData: (subnetData: Subnet[]) => void;
}
