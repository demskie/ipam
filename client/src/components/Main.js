import React from "react";
import debounce from "debounce";
import { HostDetails } from "./HostDetails.js";
import { AdvancedOverlay } from "./AdvancedOverlay.js";
import { Alert, Intent, Toaster, Classes, Position } from "@blueprintjs/core";
import { CustomSidebar } from "./CustomSidebar.js";
import { CustomNavbar } from "./CustomNavbar.js";

const sidebarMinimumWidth = 500;

const notifications = Toaster.create({
	autoFocus: false,
	canEscapeKeyClear: false,
	className: Classes.DARK,
	position: Position.BOTTOM
});

export class Main extends React.Component {
	constructor() {
		super();
		let tcp = window.location.protocol === "https:" ? "wss://" : "ws://";
		let host = window.location.host;
		this.state = {
			websocket: new WebSocket(tcp + host + "/sync"),

			sidebarOpen: false,
			sidebarDocked: false,
			sidebarWidth: 0,

			subnetData: [],
			selectedTreeNode: {},
			subnetPromptAction: "",
			subnetPromptEnabled: false,

			hostData: {
				addresses: new Array(128),
				aRecords: new Array(128),
				pingResults: new Array(128),
				lastAttempts: new Array(128)
			},
			hostDetailsWidth: 0,
			hostDetailsHeight: 0,

			historyData: [],
			debugData: [],

			scanData: [],
			scanTarget: "",

			advancedOverlayEnabled: false,
			advancedOverlayWidth: 0,
			advancedOverlayHeight: 0,

			alertVisible: false
		};
	}

	updateDimensions = () => {
		let dockedBool;
		let sidebarWidth = document.getElementById("root").clientWidth / 3;
		if (sidebarWidth >= sidebarMinimumWidth) {
			dockedBool = true;
		} else {
			dockedBool = false;
			sidebarWidth = sidebarMinimumWidth;
		}
		let tableWidth = document.getElementById("root").clientWidth;
		if (dockedBool) {
			tableWidth -= sidebarWidth;
		}
		this.setState({
			sidebarDocked: dockedBool,
			sidebarWidth: sidebarWidth,
			hostDetailsWidth: tableWidth,
			hostDetailsHeight: document.getElementById("root").clientHeight - 50,
			advancedOverlayWidth: document.getElementById("root").clientWidth * 0.8,
			advancedOverlayHeight: document.getElementById("root").clientHeight * 0.8
		});
	};

	handleWebsocketMessage = () => {
		this.state.websocket.addEventListener("message", ev => {
			let msg = JSON.parse(ev.data);
			switch (msg.requestType) {
				case "DISPLAYERROR":
					console.log("DISPLAYERROR", msg.requestData);
					if (msg.requestData[0].toLowerCase().search("could not scan") !== -1) {
						this.setState({
							scanTarget: ""
						});
					}
					notifications.show({
						intent: Intent.DANGER,
						message: msg.requestData[0].charAt(0).toUpperCase() + msg.requestData[0].substr(1),
						timeout: 0
					});
					break;
				case "DISPLAYSUBNETDATA":
					console.log("DISPLAYSUBNETDATA");
					this.setState({ subnetData: msg.requestData });
					break;
				case "DISPLAYHOSTDATA":
					console.log("DISPLAYHOSTDATA");
					this.setState({
						hostData: {
							addresses: msg.requestData[0],
							aRecords: msg.requestData[1],
							pingResults: msg.requestData[2],
							lastAttempts: msg.requestData[3]
						}
					});
					break;
				case "DISPLAYHISTORYDATA":
					console.log("DISPLAYHISTORYDATA");
					this.setState({
						historyData: msg.requestData
					});
					break;
				case "DISPLAYDEBUGDATA":
					console.log("DISPLAYDEBUGDATA");
					this.setState({
						debugData: msg.requestData
					});
					break;
				case "DISPLAYSCANDATA":
					console.log("DISPLAYSCANDATA");
					this.setState({
						scanData: msg.requestData
					});
					break;
				default:
					console.log("received unknown message type:", msg.requestType);
			}
		});
	};

	handleWebsocketCreation = () => {
		this.state.websocket.addEventListener("open", () => {
			this.handleUserAction({ action: "getSubnetData" });
			this.handleUserAction({ action: "getHistoryData" });
			setInterval(() => {
				this.handleUserAction({ action: "getSubnetData" });
			}, 60000);
			setInterval(() => {
				this.handleUserAction({ action: "getHistoryData" });
			}, 65432);
		});
		setTimeout(() => {
			if (this.state.websocket.readyState !== 1 && window.location.hostname !== "localhost") {
				this.setState({ alertVisible: true });
			}
		}, 5000);
		this.state.websocket.addEventListener("close", () => {
			if (window.location.hostname !== "localhost") {
				this.setState({ alertVisible: true });
			}
		});
	};

	watchForOutdatedCache = () => {
		let interval = setInterval(() => {
			if (window.isOutdated === true) {
				notifications.show({
					action: {
						onClick: () => window.location.reload(true),
						text: "Refresh"
					},
					icon: "",
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
			}, 0);
		}
	};

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateDimensions, 1000));
		this.updateDimensions();
		this.handleWebsocketMessage();
		this.handleWebsocketCreation();
		this.watchForOutdatedCache();
		this.displaySidebarOnce();
	};

	handleUserAction = obj => {
		switch (obj.action) {
			case "select":
				this.setState({ selectedTreeNode: obj.nodeData });
				this.handleUserAction({ action: "getHostData", nodeData: obj.nodeData });
				break;
			case "create":
				if (this.state.websocket.readyState === 1) {
					console.debug("POSTNEWSUBNET", obj);
					this.state.websocket.send(
						JSON.stringify({
							RequestType: "POSTNEWSUBNET",
							RequestData: [obj.nodeData.net, obj.nodeData.desc, obj.nodeData.vlan, obj.nodeData.notes]
						})
					);
				} else {
					console.log("caught userAction while websocket was closed:", obj);
				}
				this.setState({
					subnetPromptEnabled: false
				});
				break;
			case "modify":
				if (this.state.websocket.readyState === 1) {
					console.debug("POSTMODIFYSUBNET", obj);
					this.state.websocket.send(
						JSON.stringify({
							RequestType: "POSTMODIFYSUBNET",
							RequestData: [obj.nodeData.net, obj.nodeData.desc, obj.nodeData.vlan, obj.nodeData.notes]
						})
					);
				} else {
					console.log("caught userAction while websocket was closed:", obj);
				}
				this.setState({
					subnetPromptEnabled: false
				});
				break;
			case "delete":
				if (this.state.websocket.readyState === 1) {
					console.debug("POSTDELETESUBNET", obj);
					this.state.websocket.send(
						JSON.stringify({
							RequestType: "POSTDELETESUBNET",
							RequestData: [obj.nodeData.net]
						})
					);
				} else {
					console.log("caught userAction while websocket was closed:", obj);
				}
				this.setState({
					subnetPromptEnabled: false
				});
				break;
			case "getSubnetData":
				if (this.state.websocket.readyState === 1) {
					console.debug("GETSUBNETDATA");
					this.state.websocket.send(
						JSON.stringify({
							requestType: "GETSUBNETDATA",
							requestData: []
						})
					);
				} else {
					console.log("GETSUBNETDATA failed because websocket was not open");
				}
				break;
			case "getHostData":
				if (this.state.websocket.readyState === 1) {
					console.debug("GETHOSTDATA", obj);
					this.state.websocket.send(
						JSON.stringify({
							requestType: "GETHOSTDATA",
							requestData: [obj.nodeData.net]
						})
					);
				} else {
					console.log("GETHOSTDATA failed because websocket was not open");
				}
				break;
			case "getHistoryData":
				if (this.state.websocket.readyState === 1) {
					console.debug("GETHISTORYDATA");
					this.state.websocket.send(
						JSON.stringify({
							requestType: "GETHISTORYDATA",
							requestData: []
						})
					);
				} else {
					console.log("GETHISTORYDATA failed because websocket was not open");
				}
				break;
			case "getDebugData":
				if (this.state.websocket.readyState === 1) {
					console.debug("GETDEBUGDATA");
					this.state.websocket.send(
						JSON.stringify({
							requestType: "GETDEBUGDATA",
							requestData: []
						})
					);
				} else {
					console.log("GETDEBUGDATA failed because websocket was not open");
				}
				break;
			case "getScanStart":
				if (obj.value.search("/32") !== -1 || obj.value.search("/128") !== -1) {
					notifications.show({
						intent: Intent.WARNING,
						message: "cannot scan '" + obj.value + "' as it is not large enough",
						timeout: 0
					});
					break;
				}
				this.setState({ scanTarget: obj.value, scanData: [] });
				if (this.state.websocket.readyState === 1) {
					this.state.websocket.send(
						JSON.stringify({
							requestType: "GETSCANSTART",
							requestData: [obj.value]
						})
					);
				} else {
					console.log("GETSCANSTART failed because websocket was not open");
				}
				obj.scanner = setInterval(() => {
					if (this.state.scanTarget !== obj.value) {
						clearInterval(obj.scanner);
					} else {
						if (this.state.websocket.readyState === 1) {
							this.state.websocket.send(
								JSON.stringify({
									requestType: "GETSCANDATA",
									requestData: [obj.value]
								})
							);
						} else {
							console.log("GETSCANUPDATE failed because websocket was not open");
						}
						let unresolvedPings = false;
						for (let i = 0; i < this.state.scanData.length; i++) {
							if (this.state.scanData[i][2] === "true") {
								unresolvedPings = true;
								break;
							}
						}
						if (unresolvedPings === false && this.state.scanData.length > 0) {
							this.setState({
								scanTarget: ""
							});
						}
					}
				}, 1000);
				break;
			case "triggerSubnetMutationButton":
				this.setState({
					subnetPromptAction: obj.value,
					subnetPromptEnabled: true
				});
				break;
			case "triggerSidebarToggle":
				this.setState({
					sidebarOpen: !this.state.sidebarOpen
				});
				break;
			case "setSidebarOpen":
				this.setState({
					sidebarOpen: obj.value
				});
				break;
			case "closeSubnetPrompt":
				this.setState({
					subnetPromptEnabled: false
				});
				break;
			case "showAdvancedOverlay":
				this.setState({
					advancedOverlayEnabled: true
				});
				break;
			case "closeAdvancedOverlay":
				this.setState({
					advancedOverlayEnabled: false
				});
				break;
			default:
				console.log("Error! unknown user action:", obj);
		}
	};

	render() {
		return (
			<React.Fragment>
				<CustomSidebar
					content={
						<div>
							<CustomNavbar handleUserAction={this.handleUserAction} sidebarDocked={this.state.sidebarDocked} />
							<HostDetails
								hostData={this.state.hostData}
								hostDetailsWidth={this.state.hostDetailsWidth}
								hostDetailsHeight={this.state.hostDetailsHeight}
							/>
						</div>
					}
					handleUserAction={this.handleUserAction}
					selectedTreeNode={this.state.selectedTreeNode}
					sidebarOpen={this.state.sidebarOpen}
					sidebarDocked={this.state.sidebarDocked}
					sidebarWidth={this.state.sidebarWidth}
					subnetData={this.state.subnetData}
					subnetPromptAction={this.state.subnetPromptAction}
					subnetPromptEnabled={this.state.subnetPromptEnabled}
				/>
				<Alert
					className="bp3-dark"
					confirmButtonText="Reconnect"
					icon="warning-sign"
					intent={Intent.WARNING}
					isOpen={this.state.alertVisible}
					onClose={() => window.location.reload(true)}
				>
					<p>{"Could not connect to server"}</p>
				</Alert>
				<AdvancedOverlay
					advancedOverlayEnabled={this.state.advancedOverlayEnabled}
					advancedOverlayWidth={this.state.advancedOverlayWidth}
					advancedOverlayHeight={this.state.advancedOverlayHeight}
					debugData={this.state.debugData}
					handleUserAction={this.handleUserAction}
					historyData={this.state.historyData}
					scanData={this.state.scanData}
					scanTarget={this.state.scanTarget}
				/>
			</React.Fragment>
		);
	}
}
