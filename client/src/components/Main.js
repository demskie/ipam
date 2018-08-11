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
			height: "0px"
		};
	}

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
				<CustomToolbar />
				<Flex style={{ height: this.state.height }}>
					<NestedSubnets />
					<HostDetails />
				</Flex>
			</div>
		);
	}
}
