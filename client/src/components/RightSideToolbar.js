import React from "react";
import PropTypes from "prop-types";
import fscreen from "fscreen";
import { Button, Navbar, NavbarGroup, Alignment, Alert } from "@blueprintjs/core";

export class RightSideToolbar extends React.Component {
	constructor() {
		super();
		this.state = {
			fullscreenButtonDisabled: false,
			fullscreenAlertIsOpen: false
		};
	}

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

	render() {
		return (
			<div style={{ height: "50px" }}>
				<Navbar className="bp3-dark" style={{ paddingLeft: "5px", paddingRight: "5px" }}>
					<NavbarGroup align={Alignment.LEFT}>
						<Button
							className="bp3-minimal bp3-large"
							icon="menu"
							disabled={this.props.sidebarButtonDisabled}
							onClick={this.props.toggleSidebarTrigger}
						/>
						<div className="bp3-navbar-heading" style={{ marginLeft: "10px" }}>
							<b>IPAM</b>
						</div>
					</NavbarGroup>

					<NavbarGroup align={Alignment.RIGHT}>
						<Button text="Advanced Options" onClick={this.props.showAdvancedOverlay} />
						<Button
							className="bp3-minimal bp3-large"
							icon="fullscreen"
							style={{ marginLeft: "10px", marginRight: "5px" }}
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

RightSideToolbar.propTypes = {
	sidebarButtonDisabled: PropTypes.bool,
	toggleSidebarTrigger: PropTypes.func,
	showAdvancedOverlay: PropTypes.func
};
