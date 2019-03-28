import React from "react";

import _ from "lodash-es";
import Sidebar from "react-sidebar";
import { ITreeNode, Alert, Toaster, Classes, Position, Intent } from "@blueprintjs/core";

import { Top } from "./Top";
import { Left } from "./Left";
import { Right, HostData } from "./Right";
import { AdvancedPrompt, AdvancedPromptMode } from "./AdvancedPrompt";
import { SubnetPrompt, SubnetPromptMode } from "./left/SubnetPrompt";
import { WebsocketManager } from "./websocket/Manager";
import { Subnet } from "./left/SubnetTree";
import { ScanAddr } from "./advancedprompt/Pingsweep";

const rootElement = document.getElementById("root") as HTMLElement;
const sidebarWidth = 650;

export const notifications = Toaster.create({
	autoFocus: false,
	canEscapeKeyClear: false,
	className: Classes.DARK,
	position: Position.BOTTOM
});

export class MainState {
	websocket: WebsocketManager;

	sidebarOpen = false;
	sidebarDocked = false;

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

	alertVisible = false;

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
		let interval = setInterval(() => {
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
			}, 1000);
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
							backgroundColor: "#30404D"
						}
					}}
					sidebar={<Left {...this.state} />}
				>
					{
						<React.Fragment>
							<Top {...this.state} />
							<Right
								hostData={this.state.hostData}
								hostDetailsWidth={this.state.hostDetailsWidth}
								hostDetailsHeight={this.state.hostDetailsHeight}
							/>
						</React.Fragment>
					}
				</Sidebar>
				<AdvancedPrompt {...this.state} />
				<Alert
					className="bp3-dark"
					confirmButtonText="Reconnect"
					icon="warning-sign"
					intent={Intent.WARNING}
					isOpen={this.state.alertVisible}
					onClose={() => window.location.reload(true)}
				>
					<p>{"Lost connection with server"}</p>
				</Alert>
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
		this.state.triggers.createSubnet = (user: string, pass: string, subnet: Subnet) => {
			// do something
		};
		this.state.triggers.modifySubnet = (user: string, pass: string, subnet: Subnet) => {
			// do something
		};
		this.state.triggers.deleteSubnet = (user: string, pass: string, subnet: Subnet) => {
			// do something
		};
		this.state.triggers.setAdvancedPromptMode = (mode: AdvancedPromptMode) => {
			this.setState({ advancedPromptMode: mode });
		};
		this.state.triggers.startScan = (net: string) => {
			// do something
		};
		this.state.triggers.processCompleteSubnetData = (subnetData: Subnet[]) => {
			// do something
		};
		this.state.triggers.processFilteredSubnetData = (subnetData: Subnet[], filter: string) => {
			// do something
		};
	};
}

export interface MainTriggers {
	toggleSidebar: () => void;
	selectTreeNode: (node: Subnet) => void;
	setRootSubnetPromptMode: (mode: SubnetPromptMode) => void;
	createSubnet: (user: string, pass: string, subnet: Subnet) => void;
	modifySubnet: (user: string, pass: string, subnet: Subnet) => void;
	deleteSubnet: (user: string, pass: string, subnet: Subnet) => void;
	setAdvancedPromptMode: (mode: AdvancedPromptMode) => void;
	startScan: (net: string) => void;
	processCompleteSubnetData: (subnetData: Subnet[]) => void;
	processFilteredSubnetData: (subnetData: Subnet[], filter: string) => void;
}
