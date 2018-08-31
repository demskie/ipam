import React from "react";
import PropTypes from "prop-types";
import fscreen from "fscreen";
import debounce from "debounce";
import { Button, Navbar, NavbarGroup, Alignment, Alert, InputGroup, Intent } from "@blueprintjs/core";
import { CustomSpinner } from "./CustomSpinner/CustomSpinner.js";

var searchInputValue;
var searchPendingIntervalFunc;

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

	handleSearchIntervalStart = () => {
		if (searchInputValue === "") {
			this.setState({
				spinnerCycleTime: 0,
				spinnerPercent: 0,
				spinnerIntent: Intent.NONE
			});
			clearInterval(searchPendingIntervalFunc);
			return;
		}
		this.setState({
			spinnerCycleTime: 0,
			spinnerPercent: 0.0001,
			spinnerIntent: Intent.PRIMARY
		});
		clearInterval(searchPendingIntervalFunc);
		searchPendingIntervalFunc = setInterval(() => {
			const spinnerPercent = this.state.spinnerPercent;
			this.setState({
				spinnerPercent: spinnerPercent + 100 / 3000
			});
		}, 100);
	};

	debouncedSearchValueMutation = debounce(() => {
		if (searchInputValue != "") {
			clearInterval(searchPendingIntervalFunc);
			this.props.handleUserAction({ action: "search", value: searchInputValue });
			this.setState({
				spinnerCycleTime: 1.5,
				spinnerPercent: 0.25,
				spinnerIntent: Intent.PRIMARY
			});
			let i = 0;
			const waitForResult = setInterval(() => {
				if (i > 10000 / 100 || this.props.searchResult == searchInputValue) {
					clearInterval(waitForResult);
					this.setState({
						spinnerCycleTime: 0,
						spinnerPercent: 1,
						spinnerIntent: Intent.DANGER
					});
				}
				i++;
			}, 100);
		} else {
			this.props.handleUserAction({ action: "getSubnetData" });
		}
	}, 3000);

	componentWillUnmount = () => {
		clearInterval(searchPendingIntervalFunc);
	};

	render() {
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
						<div className="bp3-navbar-heading" style={{ marginLeft: "10px" }}>
							<b>IPAM</b>
						</div>
					</NavbarGroup>

					<NavbarGroup align={Alignment.RIGHT}>
						<InputGroup
							id="searchInput"
							leftIcon="search"
							onChange={ev => {
								searchInputValue = ev.target.value;
								this.handleSearchIntervalStart();
								this.debouncedSearchValueMutation();
							}}
							placeholder="Search..."
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
							style={{ width: "220px" }}
						/>
						<Button
							text="Advanced"
							style={{ marginLeft: "20px" }}
							onClick={() => {
								this.props.handleUserAction({ action: "showAdvancedOverlay" });
							}}
						/>
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

CustomNavbar.propTypes = {
	handleUserAction: PropTypes.func.isRequired,
	sidebarDocked: PropTypes.bool.isRequired,
	searchResult: PropTypes.string.isRequired
};
