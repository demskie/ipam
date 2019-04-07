import React from "react";
import fscreen from "fscreen";
import _ from "lodash-es";
import {
	Button,
	Navbar,
	NavbarGroup,
	Alignment,
	Alert,
	InputGroup,
	Popover,
	Menu,
	MenuItem,
	Colors,
	PopoverInteractionKind,
	Switch,
	ButtonGroup,
	AnchorButton
} from "@blueprintjs/core";

import { MainState as TopProps, rootElement } from "./Main";
import { BasicTextOverlayMode } from "./BasicTextOverlay";

class TopState {
	clientWidth = rootElement.clientWidth;
	fullscreenDisabled = false;
	fullscreenAlertIsOpen = false;
}

export class Top extends React.Component<TopProps, TopState> {
	state = new TopState();

	componentDidMount() {
		window.addEventListener("resize", () => {
			this.setState({ clientWidth: rootElement.clientWidth });
		});
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
				fullscreenDisabled: true,
				fullscreenAlertIsOpen: true
			});
		}
	};

	render() {
		return (
			<div className="top" style={{ height: "50px" }}>
				<Navbar className={"bp3-dark"} style={{ paddingLeft: "5px", paddingRight: "5px", minWidth: "635px" }}>
					<NavbarGroup align={Alignment.LEFT}>
						<Button
							className={"bp3-large"}
							icon="menu"
							disabled={false}
							minimal={true}
							onClick={() => {
								this.props.triggers.toggleSidebar();
							}}
						/>
						<div className="bp3-navbar-heading" style={{ marginLeft: "20px", marginRight: "30px" }}>
							<b>IPAM</b>
						</div>
						<InputGroup
							id="searchInput"
							leftIcon="search"
							onChange={(ev: React.FormEvent<HTMLInputElement>) => {
								console.log((ev.target as HTMLSelectElement).value);
								// searchInputValue = ev.target.value;
								// if (searchInputValue === "") {
								// 	this.setState({
								// 		spinnerCycleTime: 0,
								// 		spinnerPercent: 0,
								// 		spinnerIntent: Intent.NONE
								// 	});
								// }
								// this.debouncedSearchValueMutation();
							}}
							placeholder=""
							// rightElement={
							// 	<CustomSpinner
							// 		cycleTime={this.state.spinnerCycleTime}
							// 		floatPercent={this.state.spinnerPercent}
							// 		intent={this.state.spinnerIntent}
							// 		margin={5}
							// 		pixelSize={20}
							// 	/>
							// }
							round={true}
							style={{ width: "240px", color: "white", marginRight: "20px" }}
						/>
					</NavbarGroup>
					<NavbarGroup align={Alignment.RIGHT}>
						<ButtonGroup minimal={false} onMouseEnter={() => {}}>
							<Popover
								interactionKind={PopoverInteractionKind.CLICK}
								position={"bottom"}
								content={
									<Menu>
										<Button
											style={{ display: "block", padding: "15px", paddingTop: "7px", margin: "13px" }}
											onClick={() => {
												this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.PINGSWEEP);
											}}
										>
											<span
												style={{ paddingBottom: "5px", display: "inline-block", width: "100%", textAlign: "center" }}
											>
												{"255.255.255.255/24"}
											</span>
											<div className="bp3-progress-bar" style={{ width: "300px" }}>
												<div className="bp3-progress-meter" style={{ width: "25%" }} />
											</div>
										</Button>
										<Button
											style={{ display: "block", padding: "15px", paddingTop: "7px", margin: "13px" }}
											onClick={() => {
												this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.PINGSWEEP);
											}}
										>
											<span
												style={{ paddingBottom: "5px", display: "inline-block", width: "100%", textAlign: "center" }}
											>
												{"255.255.255.255/24"}
											</span>
											<div className="bp3-progress-bar" style={{ width: "300px" }}>
												<div className="bp3-progress-meter" style={{ width: "50%" }} />
											</div>
										</Button>
										<Button
											style={{ display: "block", padding: "15px", paddingTop: "7px", margin: "13px" }}
											onClick={() => {
												this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.PINGSWEEP);
											}}
										>
											<span
												style={{ paddingBottom: "5px", display: "inline-block", width: "100%", textAlign: "center" }}
											>
												{"255.255.255.255/24"}
											</span>
											<div className="bp3-progress-bar" style={{ width: "300px" }}>
												<div className="bp3-progress-meter" style={{ width: "50%" }} />
											</div>
										</Button>
										<Button
											style={{ display: "block", padding: "15px", paddingTop: "7px", margin: "13px" }}
											onClick={() => {
												this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.PINGSWEEP);
											}}
										>
											<span
												style={{ paddingBottom: "5px", display: "inline-block", width: "100%", textAlign: "center" }}
											>
												{"255.255.255.255/24"}
											</span>
											<div className="bp3-progress-bar" style={{ width: "300px" }}>
												<div className="bp3-progress-meter" style={{ width: "75%" }} />
											</div>
										</Button>
									</Menu>
								}
								target={<Button icon="geosearch">{this.state.clientWidth >= 866 ? "Scanner" : ""}</Button>}
							/>

							<Button icon="diagram-tree">{this.state.clientWidth >= 801 ? "Visualization" : ""}</Button>
							<Popover
								interactionKind={PopoverInteractionKind.CLICK}
								position={"bottom"}
								content={
									<Menu style={{ padding: "20px" }}>
										<Switch
											label="Dark Mode"
											checked={this.props.darkMode}
											alignIndicator={Alignment.RIGHT}
											onChange={this.props.triggers.toggleDarkMode}
										/>
										<Switch
											label="Notifications"
											checked={this.props.allowNotifications}
											alignIndicator={Alignment.RIGHT}
											onChange={this.props.triggers.toggleNotifications}
										/>
										<Switch
											label="Save Login"
											checked={this.props.cacheLogin}
											alignIndicator={Alignment.RIGHT}
											onChange={this.props.triggers.toggleLoginCache}
										/>
										<Button
											style={{
												display: "block",
												marginTop: "15px",
												width: "140px",
												textAlign: "center"
											}}
											onClick={() => this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.HISTORY)}
										>
											{"Show Commit Log"}
										</Button>
										<Button
											style={{ display: "block", marginTop: "10px", width: "140px", textAlign: "center" }}
											onClick={() => this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.DEBUG)}
										>
											{"Show Server Log"}
										</Button>
									</Menu>
								}
								target={<Button icon="cog">{this.state.clientWidth >= 710 ? "Advanced" : ""}</Button>}
							/>
						</ButtonGroup>

						<Button
							style={{
								marginLeft: "16px",
								marginRight: "10px",
								borderRadius: "25px",
								width: "75px"
							}}
							minimal={true}
							active={true}
							onClick={() => console.log("Connection button was pressed")}
						>
							{this.props.websocket.isConnected() ? `${this.props.websocket.getLatencyRTT()}ms` : "125ms"}
						</Button>
						<Button
							icon="fullscreen"
							minimal={true}
							style={{ marginLeft: "5px", marginRight: "5px" }}
							onClick={this.requestFullscreen}
							disabled={this.state.fullscreenDisabled}
						/>
					</NavbarGroup>
				</Navbar>
				<Alert
					className={this.props.darkMode ? "bp3-dark" : ""}
					isOpen={this.state.fullscreenAlertIsOpen}
					confirmButtonText="Okay"
					onConfirm={() => this.setState({ fullscreenAlertIsOpen: false })}
				>
					Sorry, your browser does not appear to support fullscreen mode
				</Alert>
			</div>
		);
	}
}
