import React from "react";
import debounce from "debounce";
import { NestedSubnets } from "./NestedSubnets.js";
import { NestedSubnetsPrompt } from "./NestedSubnetsPrompt.js";
import { NestedSubnetsToolbar } from "./NestedSubnetsToolbar.js";
import { RightSideToolbar } from "./RightSideToolbar.js";
import { HostDetails } from "./HostDetails.js";
import { AdvancedOverlay } from "./AdvancedOverlay.js";
import { Alert, Intent, Toaster, Classes, Position } from "@blueprintjs/core";
import Sidebar from "react-sidebar";

const sidebarMinimumWidth = 400;

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
			nestedSubnets: [],
			nestedSubnetPromptAction: "",
			selectedSubnetInfo: {},
			nestedSubnetPromptEnabled: false,
			hostDetails: {
				addresses: [],
				aRecords: [],
				pingResults: [],
				lastAttempts: []
			},
			alertVisible: false,
			sidebarOpen: false,
			sidebarDocked: false,
			sidebarWidth: 0,
			tableWidth: 0,
			advancedOverlayEnabled: false
		};
	}

	askForHostDetails = nodeData => {
		let emptyArray = new Array(128);
		this.setState({
			selectedSubnetInfo: nodeData,
			hostDetails: {
				addresses: emptyArray,
				aRecords: emptyArray,
				pingResults: emptyArray,
				lastAttempts: emptyArray
			}
		});
		if (this.state.websocket.readyState === 1) {
			let request = {
				requestType: "GETHOSTDATA",
				requestData: [nodeData.net]
			};
			console.log("GETHOSTDATA\n", request);
			this.state.websocket.send(JSON.stringify(request));
		}
	};

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
			tableWidth: tableWidth,
			height: document.getElementById("root").clientHeight - 50 + "px"
		});
	};

	handleWebsocketClose = () => {
		this.state.websocket.addEventListener("close", () => {
			if (window.location.hostname !== "localhost") {
				this.setState({ alertVisible: true });
			}
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
				default:
					console.log("received unknown message type:", msg.requestType);
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
		let newRequestData = requestData;
		this.setState({ nestedSubnets: newRequestData });
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

	handleWebsocketCreation = () => {
		this.state.websocket.addEventListener("open", () => {
			let requestSubnetData = () => {
				if (this.state.websocket.readyState === 1) {
					let request = {
						requestType: "GETSUBNETDATA"
					};
					console.log("GETSUBNETDATA\n", request);
					this.state.websocket.send(JSON.stringify(request));
				} else {
					console.log("websocket is not open\n", this.state.websocket);
				}
			};
			requestSubnetData();
			setInterval(requestSubnetData, 10000);
		});
	};

	onSetSidebarOpen = open => {
		this.setState({ sidebarOpen: open });
	};

	toggleSidebarTrigger = () => {
		if (!this.state.sidebarDocked) {
			this.setState({
				sidebarOpen: !this.state.sidebarOpen
			});
		}
	};

	handleUserAction = obj => {
		if (obj.action === "create") {
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
		} else if (obj.action === "modify") {
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
		} else if (obj.action === "delete") {
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
		} else if (obj.action === "closeNestedSubnetsPrompt") {
			this.setState({
				nestedSubnetPromptEnabled: false
			});
		} else if (obj.action === "closeAdvancedOverlay") {
			this.setState({
				advancedOverlayEnabled: false
			});
		} else {
			console.log("Error! unknown action value:", obj);
		}
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

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateDimensions, 500));
		this.updateDimensions();
		this.handleWebsocketClose();
		this.handleWebsocketMessage();
		this.handleWebsocketCreation();
		this.watchForOutdatedCache();
	};

	render() {
		const subnetsToolbarButtonPress = val => {
			this.setState({
				nestedSubnetPromptAction: val,
				nestedSubnetPromptEnabled: true
			});
		};
		return (
			<Sidebar
				open={this.state.sidebarOpen}
				docked={this.state.sidebarDocked}
				onSetOpen={this.onSetSidebarOpen}
				styles={{
					sidebar: {
						width: this.state.sidebarWidth + "px",
						backgroundColor: "#30404D"
					}
				}}
				sidebar={
					<div>
						<NestedSubnetsToolbar
							isSidebarDocked={this.state.sidebarDocked}
							isSubnetSelected={Object.keys(this.state.selectedSubnetInfo).length === 0}
							handleButtonPress={subnetsToolbarButtonPress}
						/>
						<NestedSubnets
							isSidebarDocked={this.state.sidebarDocked}
							subnets={this.state.nestedSubnets}
							hostDetailsRequester={this.askForHostDetails}
							handleButtonPress={subnetsToolbarButtonPress}
						/>
						<NestedSubnetsPrompt
							subnetAction={this.state.nestedSubnetPromptAction}
							subnetInfo={this.state.selectedSubnetInfo}
							isOpen={this.state.nestedSubnetPromptEnabled}
							sendUserAction={this.handleUserAction}
						/>
					</div>
				}
			>
				<RightSideToolbar
					sidebarButtonDisabled={this.state.sidebarDocked}
					toggleSidebarTrigger={this.toggleSidebarTrigger}
					showAdvancedOverlay={() => {
						this.setState({
							advancedOverlayEnabled: true
						});
					}}
				/>
				<HostDetails details={this.state.hostDetails} tableWidth={this.state.tableWidth} />
				<AdvancedOverlay
					historyData={[]}
					isOpen={this.state.advancedOverlayEnabled}
					sendUserAction={this.handleUserAction}
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
			</Sidebar>
		);
	}
}
