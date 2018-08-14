import React from "react";
import PropTypes from "prop-types";

import { Overlay, Classes, Button, Intent } from "@blueprintjs/core";

export class NestedSubnetPrompt extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			newName: props.subnetInfo.name,
			newDesc: props.subnetInfo.desc,
			newVlan: props.subnetInfo.vlan,
			newNotes: props.subnetInfo.notes
		};
	}

	render() {
		const contents = () => {
			switch (this.props.subnetAction) {
			case "create":
				return (
					<div>
						<Button intent={Intent.DANGER} onClick={this.props.toggleOverlay}>
								Close
						</Button>
						<Button
							onClick={() => {
								console.log("you just clicked focus!");
							}}
							style={{ float: "right" }}
						>
								Focus button
						</Button>
					</div>
				);
			case "modify":
				return "Modify Subnet";
			case "delete":
				return "Delete Subnet";
			}
			return <h1> {"ERROR! UNKNOWN ACTION TYPE"} </h1>;
		};
		return (
			<Overlay
				className={Classes.OVERLAY_SCROLL_CONTAINER}
				isOpen={this.props.isOpen}
				onClose={this.props.toggleOverlay}
			>
				{contents}
			</Overlay>
		);
	}
}

NestedSubnetPrompt.propTypes = {
	subnetAction: PropTypes.string,
	subnetInfo: PropTypes.object,
	isOpen: PropTypes.bool,
	toggleOverlay: PropTypes.func
};
