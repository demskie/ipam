import React from "react";
import debounce from "debounce";
import { Flex } from "reflexbox";
import { CustomToolbar } from "./CustomToolbar.js";
import { NestedSubnets } from "./NestedSubnets.js";
import { HostDetails } from "./HostDetails.js";
import { Alert, Intent, Toaster } from "@blueprintjs/core";

export class Main extends React.Component {
	constructor() {
		super();
		let tcp = window.location.protocol === "https:" ? "wss://" : "ws://";
		let host = window.location.host;
		this.state = {
			websocket: new WebSocket(tcp + host + "/sync"),
			height: "0px",
			toolbarButtonDisabled: true,
			nestedSubnets: mockServerData,
			hostDetails: {
				addresses: [],
				aRecords: [],
				pingResults: [],
				lastAttempts: []
			},
			alertVisible: false
		};
	}

	askForHostDetails = selectedSubnet => {
		let emptyArray = new Array(1024);
		this.setState({
			toolbarButtonDisabled: false,
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
	};

	updateDimensions = () => {
		this.setState({
			height: document.getElementById("root").clientHeight - 50 + "px"
		});
	};

	handleWebsocketClose = () => {
		this.state.websocket.addEventListener("close", () => {
			//this.setState({ alertVisible: true });
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
	};

	processWebsocketHostData = requestData => {
		console.log("DISPLAYHOSTDATA\n", requestData);
	};

	handleWebsocketCreation = () => {
		this.state.websocket.addEventListener("open", () => {
			setInterval(() => {
				if (this.state.websocket.OPEN) {
					let request = {
						requestType: "GETSUBNETDATA"
					};
					console.log("GETSUBNETDATA\n", request);
					this.state.websocket.send(JSON.stringify(request));
				}
			}, 10000);
		});
	};

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateDimensions, 100));
		this.updateDimensions();
		this.handleWebsocketClose();
		this.handleWebsocketMessage();
		this.handleWebsocketCreation();
	};

	render() {
		return (
			<div style={{ minWidth: "800px", height: "100vh" }}>
				<CustomToolbar buttonDisabled={this.state.toolbarButtonDisabled} />
				<Flex style={{ height: this.state.height }}>
					<NestedSubnets subnets={this.state.nestedSubnets} hostDetailsRequester={this.askForHostDetails} />
					<HostDetails details={this.state.hostDetails} />
				</Flex>
				<Alert
					className="bp3-dark"
					confirmButtonText="Reconnect"
					icon="warning-sign"
					intent={Intent.WARNING}
					isOpen={this.state.alertVisible}
					onClose={() => window.location.reload({ forceGet: true })}
				>
					<p>{"Lost connection to server"}</p>
				</Alert>
			</div>
		);
	}
}

const mockServerData = [
	{
		id: 0,
		net: "255.255.255.255/18",
		desc: "alpha"
	},
	{
		id: 1,
		net: "255.255.255.255/18",
		desc: "bravo",
		childNodes: [
			{
				id: 2,
				net: "255.255.255.255/18",
				desc: "charlie"
			},
			{
				id: 3,
				net: "255.255.255.255/18",
				desc: "delta"
			},
			{
				id: 4,
				net: "255.255.255.255/18",
				desc: "echo"
			},
			{
				id: 5,
				net: "255.255.255.255/18",
				desc: "foxtrot"
			},
			{
				id: 6,
				net: "255.255.255.255/18",
				desc: "golf"
			}
		]
	}
];
