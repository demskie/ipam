import React from "react";
import PropTypes from "prop-types";
import fscreen from "fscreen";
import _ from "lodash-es";
import { Button, Navbar, NavbarGroup, Alignment, Alert, InputGroup, Intent } from "@blueprintjs/core";
import { CustomSpinner } from "./CustomSpinner/CustomSpinner.js";

var searchInputValue;

export class CustomNavbar extends React.PureComponent {
	constructor() {
		super();
		this.state = {
			fullscreenButtonDisabled: false,
			fullscreenAlertIsOpen: false,
			spinnerCycleTime: 0,
			spinnerPercent: 0,
			spinnerIntent: Intent.NONE
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

	clearSpinnerWhenFinished = () => {
		if (
			searchInputValue === this.props.lastReceivedSearchResult &&
			this.state.spinnerCycleTime !== 0 &&
			this.state.spinnerPercent !== 0 &&
			this.state.spinnerIntent !== Intent.NONE
		) {
			this.setState({
				spinnerCycleTime: 0,
				spinnerPercent: 0,
				spinnerIntent: Intent.NONE
			});
		}
	};

	debouncedSearchValueMutation = _.debounce(() => {
		this.props.handleUserAction({ action: "getSearchData", value: searchInputValue });
		if (searchInputValue !== "") {
			this.setState({
				spinnerCycleTime: 1.5,
				spinnerPercent: 0.25,
				spinnerIntent: Intent.PRIMARY
			});
		} else {
			this.props.handleUserAction({ action: "getSubnetData" });
		}
	}, 500);

	render() {
		this.clearSpinnerWhenFinished();
		return (
			<div style={{ height: "50px" }}>
				<Navbar className="bp3-dark" style={{ paddingLeft: "5px", paddingRight: "5px" }}>
					<NavbarGroup align={Alignment.LEFT}>
						<Button
							className="bp3-minimal bp3-large"
							icon="menu"
							disabled={false}
							onClick={() => {
								this.props.handleUserAction({ action: "triggerSidebarToggle" });
							}}
						/>
						<div className="bp3-navbar-heading" style={{ marginLeft: "20px", marginRight: "30px" }}>
							<b>IPAM</b>
						</div>
						<InputGroup
							id="searchInput"
							leftIcon="search"
							onChange={ev => {
								searchInputValue = ev.target.value;
								if (searchInputValue === "") {
									this.setState({
										spinnerCycleTime: 0,
										spinnerPercent: 0,
										spinnerIntent: Intent.NONE
									});
								}
								this.debouncedSearchValueMutation();
							}}
							placeholder=""
							rightElement={
								<CustomSpinner
									cycleTime={this.state.spinnerCycleTime}
									floatPercent={this.state.spinnerPercent}
									intent={this.state.spinnerIntent}
									margin={5}
									pixelSize={20}
								/>
							}
							round={true}
							style={{ width: "260px" }}
						/>
					</NavbarGroup>

					<NavbarGroup align={Alignment.RIGHT}>
						<Button
							className="bp3-minimal"
							icon="info-sign"
							style={{ marginLeft: "15px", marginRight: "5px" }}
							onClick={() => {
								this.props.handleUserAction({ action: "showAdvancedOverlay" });
							}}
						/>
						<Button
							className="bp3-minimal"
							icon="fullscreen"
							style={{ marginRight: "5px" }}
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

CustomNavbar.propTypes = {
	handleUserAction: PropTypes.func.isRequired,
	sidebarDocked: PropTypes.bool.isRequired,
	lastReceivedSearchResult: PropTypes.string.isRequired
};
