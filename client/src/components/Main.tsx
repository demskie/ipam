import React from "react";

import { debounce } from "lodash-es";
import Sidebar from "react-sidebar";
import { Toaster, Position, Intent, Colors } from "@blueprintjs/core";

import * as idb from "idb-keyval";

import netparser from "netparser";

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

	demoMode = false;

	sidebarOpen = false;
	sidebarDocked = false;

	scannerPopupOpen = false;

	darkMode = isOSX || isMobile || isTablet;
	allowNotifications = true;
	cacheLogin = false;

	emptySearchField = true;

	subnetData = [] as Subnet[];
	selectedTreeNode = {} as Subnet;
	rootSubnetPromptMode = SubnetPromptMode.CLOSED;

	hostData = require("../mockdata/hosts.json") as HostData;
	hostDetailsWidth = 0;
	hostDetailsHeight = 0;

	historyData = [] as string[];
	debugData = [] as string[];

	scanTargets = [] as ScanTarget[];
	selectedScanTarget = "";

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
		this.getDarkMode().then(darkMode =>
			this.setState({ darkMode }, () => idb.set("darkMode", darkMode ? "true" : "false"))
		);
		window.addEventListener("resize", debounce(this.updateDimensions, 1000));
		this.updateDimensions();
		this.watchForOutdatedCache();
		this.displaySidebarOnce();
		this.attachTriggers();
		setTimeout(() => this.createInitialScanTargets(), 2500);
	}

	async getDarkMode() {
		const val = (await idb.get("darkMode")) as string | undefined;
		console.log("darkMode:", val);
		if (val === undefined) {
			return isOSX || isMobile || isTablet;
		} else if (val === "true") {
			return true;
		}
		return false;
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

	createInitialScanTargets() {
		// BUG: this is a hack
		const subnets = [
			"10.0.0.0/24",
			"10.1.0.0/24",
			"10.2.0.0/24",
			"192.168.0.0/24",
			"192.168.1.0/24",
			"192.168.2.0/24"
		];
		for (var subnet of subnets) {
			this.state.triggers.startScanning(subnet);
		}
	}

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
								demoMode={this.state.demoMode}
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
		this.state.triggers.setMainState = newState => {
			this.setState(newState);
		};
		this.state.triggers.enableDemoMode = () => {
			if (!this.state.demoMode) {
				this.setState({ demoMode: true });
			}
		};
		this.state.triggers.toggleDarkMode = () => {
			this.setState({ darkMode: !this.state.darkMode }, () => {
				idb.set("darkMode", this.state.darkMode ? "true" : "false");
			});
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
		this.state.triggers.selectTreeNode = node => {
			this.setState({ selectedTreeNode: node }, () => {
				messageSenders.sendSpecificHosts(node.net, this.state.websocket);
			});
		};
		this.state.triggers.setRootSubnetPromptMode = mode => {
			this.setState({ rootSubnetPromptMode: mode });
		};
		this.state.triggers.getUsername = () => {
			return this.state.websocket.getUsername();
		};
		this.state.triggers.getPassword = () => {
			return this.state.websocket.getPassword();
		};
		this.state.triggers.createSubnet = subnetRequest => {
			messageSenders.sendCreateSubnet(subnetRequest, this.state.websocket);
		};
		this.state.triggers.modifySubnet = subnetRequest => {
			messageSenders.sendModifySubnet(subnetRequest, this.state.websocket);
		};
		this.state.triggers.deleteSubnet = subnetRequest => {
			messageSenders.sendDeleteSubnet(subnetRequest, this.state.websocket);
		};
		this.state.triggers.setBasicTextOverlayMode = mode => {
			this.setState({ basicTextOverlayMode: mode });
		};
		this.state.triggers.startScanning = net => {
			if (!netparser.network(net) || netparser.baseAddress(net) !== netparser.ip(net)) return;
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
		this.state.triggers.getScanTargets = () => {
			return [...this.state.scanTargets];
		};
		this.state.triggers.updateScanTarget = (net, results) => {
			console.log(this.state.scanTargets);
			const arr = [...this.state.scanTargets];
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].target === net) {
					arr[i].entries = results;
					this.setState({ scanTargets: arr });
					return;
				}
			}
		};
		this.state.triggers.searchFieldIsEmpty = () => {
			return this.state.emptySearchField;
		};
		this.state.triggers.selectScanTarget = target => {
			this.setState({ selectedScanTarget: target });
		};
		this.state.triggers.openScannerPopup = () => {
			this.setState({ scannerPopupOpen: true });
		};
		this.state.triggers.closeScannerPopup = () => {
			this.setState({ scannerPopupOpen: false });
		};
	};
}

export interface MainTriggers {
	setMainState: React.Component<{}, MainState>["setState"];
	enableDemoMode: () => void;
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
	getScanTargets: () => ScanTarget[];
	updateScanTarget: (net: string, entries: ScanEntry[]) => void;
	searchFieldIsEmpty: () => boolean;
	selectScanTarget: (target: string) => void;
	openScannerPopup: () => void;
	closeScannerPopup: () => void;
}

// this is for debugMode
const fakeHostnameMap = new Map() as Map<string, string>;

export function getFakeHostname(address: string) {
	let val = fakeHostnameMap.get(address);
	if (!val) {
		val = `${CHANCE.animal()}-${CHANCE.city()}.${window.location.host.split(":")[0]}`;
		fakeHostnameMap.set(address, val);
	}
	return val;
}
