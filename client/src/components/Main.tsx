import React from "react";

import _ from "lodash-es";
import Sidebar from "react-sidebar";
import { Toaster, Classes, Position, Intent, Colors } from "@blueprintjs/core";

import UAParser from "ua-parser-js";
export const parser = new UAParser();

import { Chance } from "chance";
export const CHANCE = Chance();

import { Top } from "./Top";
import { Left } from "./Left";
import { Right, HostData } from "./Right";
import { AdvancedPrompt, AdvancedPromptMode } from "./AdvancedPrompt";
import { SubnetPromptMode } from "./left/SubnetPrompt";
import { WebsocketManager } from "./websocket/WebsocketManager";
import { Subnet } from "./left/SubnetTree";
import { ScanAddr } from "./advancedprompt/Pingsweep";
import { SubnetRequest } from "./websocket/MessageTypes";
import { messageSenders } from "./websocket/MessageHandlers";

const rootElement = document.getElementById("root") as HTMLElement;
const sidebarWidth = 530;

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

	darkMode =
		true &&
		(parser.getOS().name == "Mac OS" || parser.getDevice().type === "mobile" || parser.getDevice().type === "tablet");

	emptySearchField = true;
	lastTransmittedSearchQuery = "";
	lastReceivedSearchResult = "";

	subnetData = require("../mockdata/subnets.json") as Subnet[];
	selectedTreeNode = {} as Subnet;
	rootSubnetPromptMode = SubnetPromptMode.CLOSED;

	hostData = require("../mockdata/hosts.json") as HostData;
	hostDetailsWidth = 0;
	hostDetailsHeight = 0;

	historyData = [] as string[];
	debugData = [] as string[];

	scanData = [] as ScanAddr[];
	scanTarget = "192.168.128.0/24";

	advancedPromptMode = AdvancedPromptMode.CLOSED;
	advancedPromptWidth = 0;
	advancedPromptHeight = 0;

	readonly triggers = {} as MainTriggers;

	constructor(setState: React.Component<{}, MainState>["setState"]) {
		this.websocket = new WebsocketManager(setState, this.triggers);
	}
}

export class Main extends React.Component<{}, MainState> {
	state = new MainState(this.setState as React.Component<{}, MainState>["setState"]);

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
			advancedPromptWidth: rootElement.clientWidth * 0.8,
			advancedPromptHeight: rootElement.clientHeight * 0.8
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
			}, 1500);
		}
	};

	render() {
		return (
			<React.Fragment>
				<Sidebar
					open={this.state.sidebarOpen}
					docked={this.state.sidebarDocked}
					onSetOpen={(open: boolean) => {
						this.setState({ sidebarOpen: open });
					}}
					styles={{
						sidebar: {
							width: `${sidebarWidth}px`,
							backgroundColor: this.state.darkMode ? "#30404D" : Colors.GRAY5
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
				<AdvancedPrompt {...this.state} />
			</React.Fragment>
		);
	}

	attachTriggers = () => {
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
		this.state.triggers.setAdvancedPromptMode = (mode: AdvancedPromptMode) => {
			this.setState({ advancedPromptMode: mode });
		};
		this.state.triggers.startScan = (net: string) => {
			this.setState({ scanTarget: net }, () => {
				messageSenders.sendManualPingScan(net, this.state.websocket);
			});
		};
		this.state.triggers.getScanTarget = () => {
			return this.state.scanTarget;
		};
	};
}

export interface MainTriggers {
	toggleSidebar: () => void;
	selectTreeNode: (node: Subnet) => void;
	setRootSubnetPromptMode: (mode: SubnetPromptMode) => void;
	getUsername: () => string;
	getPassword: () => string;
	createSubnet: (subnetRequest: SubnetRequest) => void;
	modifySubnet: (subnetRequest: SubnetRequest) => void;
	deleteSubnet: (subnetRequest: SubnetRequest) => void;
	setAdvancedPromptMode: (mode: AdvancedPromptMode) => void;
	startScan: (net: string) => void;
	getScanTarget: () => string;
}
