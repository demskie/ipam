import React from "react";
import debounce from "debounce";
import { Flex, Box } from "reflexbox";
import { CustomToolbar } from "./CustomToolbar.js";
import { NestedSubnets } from "./NestedSubnets.js";
import { HostDetails } from "./HostDetails.js";

export class Main extends React.Component {
	constructor() {
		super();
		this.state = {
			height: "0px",
			toolbarButtonDisabled: true,
			nestedSubnets: mockServerData,
			hostDetails: {
				addresses: [],
				aRecords: [],
				pingResults: [],
				lastAttempts: []
			}
		};
	}

	askForHostDetails = selectedSubnet => {
		let emptyArray = new Array(1024);
		this.setState({
			hostDetails: {
				addresses: emptyArray,
				aRecords: emptyArray,
				pingResults: emptyArray,
				lastAttempts: emptyArray
			},
			toolbarButtonDisabled: false
		});
	};

	updateDimensions = () => {
		this.setState({
			height: document.getElementById("root").clientHeight - 50 + "px"
		});
	};

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateDimensions, 100));
		this.updateDimensions();
	};

	render() {
		return (
			<div style={{ minWidth: "800px", height: "100vh" }}>
				<CustomToolbar buttonDisabled={this.state.toolbarButtonDisabled} />
				<Flex style={{ height: this.state.height }}>
					<NestedSubnets subnets={this.state.nestedSubnets} hostDetailsRequester={this.askForHostDetails} />
					<HostDetails details={this.state.hostDetails} />
				</Flex>
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
