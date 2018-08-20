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

			height: "0px",

			sidebarOpen: false,
			sidebarDocked: false,
			sidebarWidth: 0,

			subnetData: [],
			subnetPromptEnabled: false,
			selectedSubnet: {},
			selectedSubnetAction: "",

			tableWidth: 0,
			hostDetails: {
				addresses: new Array(128),
				aRecords: new Array(128),
				pingResults: new Array(128),
				lastAttempts: new Array(128)
			},

			historyData: [],

			debugData: [],

			alertVisible: false,

			advancedOverlayEnabled: false
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
			height: document.getElementById("root").clientHeight - 50 + "px",
			sidebarDocked: dockedBool,
			sidebarWidth: sidebarWidth,
			tableWidth: tableWidth
		});
	};

	handleWebsocketMessage = () => {
		this.state.websocket.addEventListener("message", ev => {
			let msg = JSON.parse(ev.data);
			switch (msg.requestType) {
				case "DISPLAYERROR":
					this.processWebsocketErrorMessage(msg.requestData);
					break;
				case "DISPLAYSUBNETDATA":
					this.processWebsocketSubnetData(msg.requestData);
					break;
				case "DISPLAYHOSTDATA":
					this.processWebsocketHostData(msg.requestData);
					break;
				case "DISPLAYHISTORYDATA":
					this.processWebsocketHistoryData(msg.requestData);
					break;
				case "DISPLAYDEBUGDATA":
					this.processWebsocketDebugData(msg.requestData);
					break;
				default:
					console.log("received unknown message type:", msg.requestType);
			}
		});
	};

	handleWebsocketCreation = () => {
		this.state.websocket.addEventListener("open", () => {
			setInterval(this.requestSubnetData, 60000);
			setInterval(this.requestHistoryData, 65432);
		});
	};

	handleWebsocketClose = () => {
		this.state.websocket.addEventListener("close", () => {
			if (window.location.hostname !== "localhost") {
				this.setState({ alertVisible: true });
			}
		});
	};

	processWebsocketErrorMessage = requestData => {
		console.log("DISPLAYERROR\n", requestData);
		notifications.show({
			intent: Intent.DANGER,
			message: requestData[0].charAt(0).toUpperCase() + requestData[0].substr(1),
			timeout: 0
		});
	};

	processWebsocketSubnetData = requestData => {
		console.log("DISPLAYSUBNETDATA\n", requestData);
		this.setState({ nestedSubnets: requestData });
	};

	processWebsocketHostData = requestData => {
		console.log("DISPLAYHOSTDATA\n", requestData);
		this.setState({
			hostDetails: {
				addresses: requestData[0],
				aRecords: requestData[1],
				pingResults: requestData[2],
				lastAttempts: requestData[3]
			}
		});
	};

	processWebsocketHistoryData = requestData => {
		console.log("DISPLAYHISTORYDATA");
		this.setState({
			historyData: requestData
		});
	};

	processWebsocketDebugData = requestData => {
		console.log("DISPLAYDEBUGDATA");
		this.setState({
			debugData: requestData
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
		}, 5000);
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
		window.addEventListener("resize", debounce(this.updateDimensions, 500));
		this.updateDimensions();
		this.handleWebsocketMessage();
		this.handleWebsocketCreation();
		this.handleWebsocketClose();
		this.watchForOutdatedCache();
		this.displaySidebarOnce();
	};

	handleUserAction = obj => {
		switch (obj.action) {
			case "create":
				if (this.state.websocket.readyState === 1) {
					let outMsg = {
						RequestType: "POSTNEWSUBNET",
						RequestData: [obj.subnet, obj.description, obj.vlan, obj.notes]
					};
					console.log(outMsg.RequestType + "\n", outMsg);
					this.state.websocket.send(JSON.stringify(outMsg));
				} else {
					console.log("caught an action while websocket is closed:", obj);
				}
				this.setState({
					nestedSubnetPromptEnabled: false
				});
				break;
			case "modify":
				if (this.state.websocket.readyState === 1) {
					let outMsg = {
						RequestType: "POSTMODIFYSUBNET",
						RequestData: [obj.subnet, obj.description, obj.vlan, obj.notes]
					};
					console.log(outMsg.RequestType + "\n", outMsg);
					this.state.websocket.send(JSON.stringify(outMsg));
				} else {
					console.log("caught an action while websocket is closed:", obj);
				}
				this.setState({
					nestedSubnetPromptEnabled: false
				});
				break;
			case "delete":
				if (this.state.websocket.readyState === 1) {
					let outMsg = {
						RequestType: "POSTDELETESUBNET",
						RequestData: [obj.subnet]
					};
					console.log(outMsg.RequestType + "\n", outMsg);
					this.state.websocket.send(JSON.stringify(outMsg));
				} else {
					console.log("caught an action while websocket is closed:", obj);
				}
				this.setState({
					nestedSubnetPromptEnabled: false
				});
				break;
			case "getSubnetData":
				if (this.state.websocket.readyState === 1) {
					let request = {
						requestType: "GETSUBNETDATA"
					};
					console.log("GETSUBNETDATA\n", request);
					this.state.websocket.send(JSON.stringify(request));
				} else {
					console.log("websocket is not open\n", this.state.websocket);
				}
				break;
			case "getHostData":
				if (this.state.websocket.readyState === 1) {
					let request = {
						requestType: "GETHOSTDATA",
						requestData: [obj.subnet]
					};
					console.log("GETHOSTDATA\n", request);
					this.state.websocket.send(JSON.stringify(request));
				} else {
					console.log("websocket is not open\n", this.state.websocket);
				}
				break;
			case "getHistoryData":
				if (this.state.websocket.readyState === 1) {
					let request = {
						requestType: "GETHISTORYDATA"
					};
					console.log("GETHISTORYDATA\n", request);
					this.state.websocket.send(JSON.stringify(request));
				} else {
					console.log("websocket is not open\n", this.state.websocket);
				}
				break;
			case "getDebugData":
				if (this.state.websocket.readyState === 1) {
					let request = {
						requestType: "GETDEBUGDATA"
					};
					console.log("GETDEBUGDATA\n", request);
					this.state.websocket.send(JSON.stringify(request));
				} else {
					console.log("websocket is not open\n", this.state.websocket);
				}
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
					subnetData={this.state.subnetData}
					sidebarOpen={this.state.sidebarOpen}
					sidebarDocked={this.state.sidebarDocked}
					sidebarWidth={this.state.sidebarWidth}
					handleUserAction={this.handleUserAction}
					content={
						<div>
							<CustomNavbar sidebarDocked={this.state.sidebarDocked} handleUserAction={this.handleUserAction} />
							<HostDetails />
						</div>
					}
				/>
				<Alert
					className="bp3-dark"
					confirmButtonText="Reconnect"
					icon="warning-sign"
					intent={Intent.WARNING}
					isOpen={this.state.alertVisible}
					onClose={() => window.location.reload(true)}
				>
					<p>{"Lost connection to server"}</p>
				</Alert>
				<AdvancedOverlay
					historyData={this.state.historyData}
					requestHistoryData={this.requestHistoryData}
					debugData={this.state.debugData}
					requestDebugData={this.requestDebugData}
					isOpen={this.state.advancedOverlayEnabled}
					sendUserAction={this.handleUserAction}
				/>
			</React.Fragment>
		);
	}
}
