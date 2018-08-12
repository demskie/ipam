import React from "react";
import PropTypes from "prop-types";
import fscreen from "fscreen";
import { Button, Navbar, NavbarGroup, Alignment, Alert } from "@blueprintjs/core";

export class CustomToolbar extends React.Component {
	constructor() {
		super();
		this.state = {
			selectedSearchOption: "Subnet Tree",
			buttonLabelArray: null,
			fullscreenButtonDisabled: false,
			fullscreenAlertIsOpen: false
		};
	}

	componentDidMount = () => {};

	requestFullscreen = () => {
		if (fscreen.fullscreenEnabled) {
			if (fscreen.fullscreenElement == null) {
				fscreen.requestFullscreen(document.body);
			} else {
				fscreen.exitFullscreen();
			}
		} else {
			this.setState({
				fullscreenAlertIsOpen: true
			});
		}
	};

	closeFullscreenAlert = () => {
		this.setState({
			fullscreenAlertIsOpen: false,
			fullscreenButtonDisabled: true
		});
	};

	selectSubnetTreeOption = () => {
		this.setState({ selectedSearchOption: "Subnet Tree" });
	};

	selectDNSRecordsOption = () => {
		this.setState({ selectedSearchOption: "DNS Records" });
	};

	selectChangelogOption = () => {
		this.setState({ selectedSearchOption: "Changelog" });
	};

	render() {
		return (
			<div style={{ height: "50px" }}>
				<Navbar className="bp3-dark">
					<NavbarGroup align={Alignment.LEFT}>
						<div className="bp3-navbar-heading" style={{ marginLeft: "15px" }}>
							<b>IPAM</b>
						</div>

						<Button className="bp3-minimal" icon="add" text="Create" />

						<Button
							className="bp3-minimal"
							icon="annotation"
							text="Modify"
							disabled={this.props.buttonDisabled}
						/>

						<Button
							className="bp3-minimal"
							icon="remove"
							text="Delete"
							disabled={this.props.buttonDisabled}
						/>
					</NavbarGroup>

					<NavbarGroup align={Alignment.RIGHT}>
						<Button className="bp3-minimal" icon="property" text="Advanced Options" />
						<Button
							className="bp3-minimal"
							style={{ marginLeft: "10px" }}
							icon="help"
							text=""
							onClick={() => {
								console.log("you just clicked the help button");
							}}
						/>
						<Button
							className="bp3-minimal"
							icon="fullscreen"
							text=""
							onClick={this.requestFullscreen}
							disabled={this.state.fullscreenButtonDisabled}
						/>
					</NavbarGroup>
				</Navbar>
				<Alert
					className="bp3-dark"
					isOpen={this.state.fullscreenAlertIsOpen}
					confirmButtonText="Okay"
					onConfirm={this.closeFullscreenAlert}
				>
					Sorry, your browser does not appear to support fullscreen mode
				</Alert>
			</div>
		);
	}
}

CustomToolbar.propTypes = {
	buttonDisabled: PropTypes.bool
};
