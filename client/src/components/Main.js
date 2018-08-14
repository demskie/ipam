import React from "react";
import debounce from "debounce";
import { NestedSubnets } from "./NestedSubnets.js";
import { NestedSubnetsPrompt } from "./NestedSubnetsPrompt.js";
import { RightSideToolbar } from "./RightSideToolbar.js";
import { HostDetails } from "./HostDetails.js";
import { Alert, Intent, Toaster, Navbar, NavbarGroup, Alignment, Button } from "@blueprintjs/core";
import Sidebar from "react-sidebar";

const sidebarMinimumWidth = 400;

export class Main extends React.Component {
	constructor() {
		super();
		let tcp = window.location.protocol === "https:" ? "wss://" : "ws://";
		let host = window.location.host;
		this.state = {
			websocket: new WebSocket(tcp + host + "/sync"),
			height: "0px",
			nestedSubnets: [],
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
			tableWidth: 0
		};
	}

	askForHostDetails = selectedSubnet => {
		if (this.state.websocket.readyState === 1) {
			console.log(this.state.websocket);
			let emptyArray = new Array(1024);
			this.setState({
				hostDetails: {
					addresses: emptyArray,
					aRecords: emptyArray,
					pingResults: emptyArray,
					lastAttempts: emptyArray
				}
			});
			let request = {
				requestType: "GETHOSTDATA",
				requestData: [selectedSubnet]
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
			if (window.location.hostname !== "localhost:3000") {
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
		Toaster.create({
			icon: "warning-sign",
			intent: Intent.DANGER,
			message: requestData[0],
			canEscapeKeyClear: false,
			timeout: 0
		}).show();
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
			setInterval(requestSubnetData, 15000);
		});
	};

	toggleSidebarTrigger = () => {
		if (!this.state.sidebarDocked) {
			this.setState({
				sidebarOpen: !this.state.sidebarOpen
			});
		}
	};

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateDimensions, 100));
		this.updateDimensions();
		this.handleWebsocketClose();
		this.handleWebsocketMessage();
		this.handleWebsocketCreation();
	};

	render() {
		const sidebarNavbarPadding = () => {
			if (this.state.sidebarDocked) {
				return "0px";
			}
			return "50px";
		};
		return (
			<Sidebar
				styles={{
					sidebar: {
						width: this.state.sidebarWidth + "px",
						backgroundColor: "#30404D"
					}
				}}
				sidebar={
					<div>
						<Navbar className="bp3-dark" style={{ paddingTop: sidebarNavbarPadding() }}>
							<NavbarGroup align={Alignment.LEFT}>
								<Button className="bp3-minimal" icon="add" text="Create" />
								<Button className="bp3-minimal" icon="annotation" text="Modify" disabled={true} />
								<Button className="bp3-minimal" icon="remove" text="Delete" disabled={true} />
							</NavbarGroup>
						</Navbar>
						<NestedSubnets
							subnets={this.state.nestedSubnets}
							hostDetailsRequester={this.askForHostDetails}
						/>
					</div>
				}
				open={this.state.sidebarOpen}
				docked={this.state.sidebarDocked}
				onSetOpen={this.onSetSidebarOpen}
			>
				<RightSideToolbar
					sidebarButtonDisabled={this.state.sidebarDocked}
					toggleSidebarTrigger={this.toggleSidebarTrigger}
				/>
				<HostDetails details={this.state.hostDetails} tableWidth={this.state.tableWidth} />
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
