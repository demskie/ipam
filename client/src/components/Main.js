import React from "react";
import _ from "lodash-es";
import { HostDetails } from "./HostDetails.js";
import { AdvancedOverlay } from "./AdvancedOverlay.js";
import { Alert, Intent, Toaster, Classes, Position } from "@blueprintjs/core";
import { CustomSidebar } from "./CustomSidebar.js";
import { CustomNavbar } from "./CustomNavbar.js";

const sidebarWidth = 500;
const sidebarShouldBeDocked = () => {
	return sidebarWidth <= document.getElementById("root").clientWidth / 3;
};

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

			emptySearchField: true,
			lastTransmittedSearchQuery: "",
			lastReceivedSearchResult: "",

			subnetData: [],
			selectedTreeNode: {},
			subnetPromptAction: "",
			subnetPromptEnabled: false,

			hostData: [],
			hostDetailsWidth: 0,
			hostDetailsHeight: 0,

			historyData: [],
			debugData: [],

			scanData: [],
			scanTarget: "192.168.128.0/24",
			selectedTabId: "history",

			advancedOverlayEnabled: false,
			advancedOverlayWidth: 0,
			advancedOverlayHeight: 0,

			alertVisible: false
		};
	}

	updateDimensions = () => {
		let dockedBool;
		if (sidebarShouldBeDocked()) {
			dockedBool = true;
		} else {
			dockedBool = false;
		}
		let tableWidth = document.getElementById("root").clientWidth;
		if (dockedBool) {
			tableWidth -= sidebarWidth;
		}
		this.setState({
			sidebarDocked: dockedBool,
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
					if (this.state.emptySearchField) {
						console.log("DISPLAYSUBNETDATA");
						this.setState({
							subnetData: msg.requestData
						});
					}
					break;
				case "DISPLAYHOSTDATA":
					console.log("DISPLAYHOSTDATA");
					this.setState({
						hostData: msg.requestData
					});
					break;
				case "DISPLAYHISTORYDATA":
					console.log("DISPLAYHISTORYDATA");
					setTimeout(() => {
						this.setState({
							historyData: msg.requestData
						});
					}, 250);
					break;
				case "DISPLAYDEBUGDATA":
					console.log("DISPLAYDEBUGDATA");
					setTimeout(() => {
						this.setState({
							debugData: msg.requestData
						});
					}, 250);
					break;
				case "DISPLAYSCANDATA":
					console.log("DISPLAYSCANDATA");
					this.setState({
						scanData: msg.requestData
					});
					break;
				case "DISPLAYSEARCHDATA":
					console.log("DISPLAYSEARCHDATA");
					this.setState({
						selectedTreeNode: {},
						lastReceivedSearchResult: msg.requestData.searchTarget,
						subnetData: msg.requestData.subnetData,
						hostData: msg.requestData.hostData
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
				if (this.state.searchValue === "") {
					this.handleUserAction({ action: "getSubnetData" });
				}
			}, 60000);
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
			}, 1000);
		}
	};

	componentDidMount = () => {
		window.addEventListener("resize", _.debounce(this.updateDimensions, 1000));
		this.updateDimensions();
		this.handleWebsocketMessage();
		this.handleWebsocketCreation();
		this.watchForOutdatedCache();
		this.displaySidebarOnce();
		disablePageNavigationGesture();
	};

	handleUserAction = obj => {
		reactToUserAction(this, obj);
	};

	render() {
		return (
			<React.Fragment>
				<CustomSidebar
					content={
						<div>
							<CustomNavbar
								handleUserAction={this.handleUserAction}
								sidebarDocked={this.state.sidebarDocked}
								lastReceivedSearchResult={this.state.lastReceivedSearchResult}
							/>
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
					<p>{"Lost connection with server"}</p>
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
					selectedTabId={this.state.selectedTabId}
					subnetData={this.state.subnetData}
				/>
			</React.Fragment>
		);
	}
}

const reactToUserAction = (parent, obj) => {
	switch (obj.action) {
		case "select":
			parent.setState({ selectedTreeNode: obj.nodeData });
			parent.handleUserAction({ action: "getHostData", nodeData: obj.nodeData });
			break;

		case "create":
			if (parent.state.websocket.readyState === 1) {
				parent.state.websocket.send(
					JSON.stringify({
						RequestType: "POSTNEWSUBNET",
						RequestData: [obj.nodeData.net, obj.nodeData.desc, obj.nodeData.notes, obj.nodeData.vlan]
					})
				);
			} else {
				console.log("caught userAction while websocket was closed:", obj);
			}
			parent.setState({
				subnetPromptEnabled: false
			});
			parent.handleUserAction({ action: "getSubnetData" });
			break;

		case "modify":
			if (parent.state.websocket.readyState === 1) {
				parent.state.websocket.send(
					JSON.stringify({
						RequestType: "POSTMODIFYSUBNET",
						RequestData: [obj.nodeData.net, obj.nodeData.desc, obj.nodeData.notes, obj.nodeData.vlan]
					})
				);
			} else {
				console.log("caught userAction while websocket was closed:", obj);
			}
			parent.setState({
				subnetPromptEnabled: false
			});
			parent.handleUserAction({ action: "getSubnetData" });
			break;

		case "delete":
			if (parent.state.websocket.readyState === 1) {
				parent.state.websocket.send(
					JSON.stringify({
						RequestType: "POSTDELETESUBNET",
						RequestData: [obj.nodeData.net]
					})
				);
			} else {
				console.log("caught userAction while websocket was closed:", obj);
			}
			parent.setState({
				subnetPromptEnabled: false
			});
			parent.handleUserAction({ action: "getSubnetData" });
			break;

		case "getSubnetData":
			if (parent.state.websocket.readyState === 1) {
				if (parent.state.emptySearchField) {
					parent.state.websocket.send(
						JSON.stringify({
							requestType: "GETSUBNETDATA",
							requestData: []
						})
					);
				}
			} else {
				console.log("GETSUBNETDATA failed because websocket was not open");
			}
			break;

		case "getHostData":
			if (parent.state.websocket.readyState === 1) {
				parent.state.websocket.send(
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
			if (parent.state.websocket.readyState === 1) {
				parent.state.websocket.send(
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
			if (parent.state.websocket.readyState === 1) {
				parent.state.websocket.send(
					JSON.stringify({
						requestType: "GETDEBUGDATA",
						requestData: []
					})
				);
			} else {
				console.log("GETDEBUGDATA failed because websocket was not open");
			}
			break;

		case "getSearchData":
			if (parent.state.websocket.readyState === 1) {
				if (obj.value === "") {
					parent.setState({
						emptySearchField: true,
						lastTransmittedSearchQuery: ""
					});
				} else {
					parent.setState({
						emptySearchField: false,
						lastTransmittedSearchQuery: obj.value
					});
				}
				parent.state.websocket.send(
					JSON.stringify({
						requestType: "GETSEARCHDATA",
						requestData: [obj.value]
					})
				);
			} else {
				console.log("GETSEARCHDATA failed because websocket was not open");
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
			parent.setState({ scanTarget: obj.value, scanData: [] });
			if (parent.state.websocket.readyState === 1) {
				parent.state.websocket.send(
					JSON.stringify({
						requestType: "GETSCANSTART",
						requestData: [obj.value]
					})
				);
			} else {
				console.log("GETSCANSTART failed because websocket was not open");
			}
			obj.scanner = setInterval(() => {
				if (parent.state.scanTarget !== obj.value || parent.state.scanTarget === "") {
					clearInterval(obj.scanner);
				} else {
					if (parent.state.websocket.readyState === 1) {
						parent.state.websocket.send(
							JSON.stringify({
								requestType: "GETSCANDATA",
								requestData: [obj.value]
							})
						);
					} else {
						console.log("GETSCANUPDATE failed because websocket was not open");
					}
					let unresolvedPings = false;
					for (let i = 0; i < parent.state.scanData.length; i++) {
						if (parent.state.scanData[i][2] === "true") {
							unresolvedPings = true;
							break;
						}
					}
					if (unresolvedPings === false && parent.state.scanData.length > 0) {
						parent.setState({
							scanTarget: ""
						});
					}
				}
			}, 1000);
			break;

		case "setSelectedTabId":
			parent.setState({
				selectedTabId: obj.value
			});
			break;

		case "triggerSubnetPromptAction":
			parent.setState({
				subnetPromptAction: obj.value,
				subnetPromptEnabled: true
			});
			break;

		case "triggerSidebarToggle":
			if (parent.state.sidebarDocked) {
				parent.setState({
					sidebarDocked: false,
					sidebarOpen: false
				});
			} else if (sidebarShouldBeDocked()) {
				parent.setState({
					sidebarDocked: true,
					sidebarOpen: true
				});
			} else {
				parent.setState({
					sidebarDocked: false,
					sidebarOpen: !parent.state.sidebarOpen
				});
			}
			break;

		case "setSidebarOpen":
			parent.setState({
				sidebarOpen: obj.value
			});
			break;

		case "closeSubnetPrompt":
			parent.setState({
				subnetPromptEnabled: false
			});
			break;

		case "showAdvancedOverlay":
			parent.setState({
				advancedOverlayEnabled: true
			});
			break;

		case "closeAdvancedOverlay":
			parent.setState({
				advancedOverlayEnabled: false
			});
			break;

		default:
			console.log("Error! unknown user action:", obj);
	}
};

const disablePageNavigationGesture = () => {
	// https://stackoverflow.com/questions/12381563/how-to-stop-browser-back-button-using-javascript
	(function(global) {
		if (typeof global === "undefined") {
			throw new Error("window is undefined");
		}
		var _hash = "!";
		var noBackPlease = function() {
			global.location.href += "#";
			global.setTimeout(function() {
				global.location.href += "!";
			}, 50);
		};
		global.onhashchange = function() {
			if (global.location.hash !== _hash) {
				global.location.hash = _hash;
			}
		};
		global.onload = function() {
			noBackPlease();
		};
	})(window);
};
