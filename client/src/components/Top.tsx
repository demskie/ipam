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
	AnchorButton,
	Intent
} from "@blueprintjs/core";

import netparser from "netparser";

import { MainState as TopProps, rootElement } from "./Main";
import { BasicTextOverlayMode } from "./BasicTextOverlay";
import { getScanTargetPercentage } from "./websocket/messagehandlers/ManualPingScan";

class TopState {
	clientWidth = rootElement.clientWidth;
	fullscreenDisabled = false;
	fullscreenAlertIsOpen = false;
	latency = 1000;
	isValidCIDR = true;
}

export class Top extends React.Component<TopProps, TopState> {
	state = new TopState();

	componentDidMount() {
		window.addEventListener("resize", () => {
			this.setState({ clientWidth: rootElement.clientWidth });
		});
		setInterval(() => {
			this.setState({ latency: this.props.websocket.getLatencyRTT() });
		}, 500);
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

	getScannerButtons() {
		const buttons = [] as React.ReactNode[];
		for (var scanTarget of this.props.scanTargets) {
			const percentNormal = getScanTargetPercentage(scanTarget);
			buttons.push(
				<Button
					key={scanTarget.target}
					style={{ display: "block", padding: "15px", paddingTop: "7px", margin: "13px" }}
					onClick={() => {
						this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.PINGSWEEP);
					}}
				>
					<span style={{ paddingBottom: "5px", display: "inline-block", width: "100%", textAlign: "center" }}>
						{scanTarget.target}
					</span>
					<div
						className={percentNormal < 1.0 ? "bp3-progress-bar" : "bp3-progress-bar bp3-no-stripes bp3-no-animation"}
						style={{ width: "300px" }}
					>
						<div className="bp3-progress-meter" style={{ width: `${Math.floor(percentNormal * 100)}%` }} />
					</div>
				</Button>
			);
		}
		return buttons;
	}

	render() {
		return (
			<div className="top" style={{ height: "50px" }}>
				<Navbar className={"bp3-dark"} style={{ paddingLeft: "5px", paddingRight: "5px", minWidth: "635px" }}>
					<NavbarGroup align={Alignment.LEFT}>
						<Button
							className={"bp3-large"}
							icon="menu"
							disabled={this.props.sidebarDocked}
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
								isOpen={this.props.scannerPopupOpen}
								onInteraction={nextOpenState => {
									if (nextOpenState) this.props.triggers.openScannerPopup();
								}}
								onClose={() => this.props.triggers.closeScannerPopup()}
								content={
									<Menu>
										<div style={{ display: "flex" }}>
											<InputGroup
												id={"scanner-input"}
												placeholder={"192.168.5.0/24"}
												style={{
													width: "230px",
													marginLeft: "15px",
													marginTop: "5px",
													marginRight: "10px",
													marginBottom: "5px"
												}}
												onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
													if (event.target.value !== "") {
														const sn = event.target.value;
														if (!netparser.network(sn) || netparser.baseAddress(sn) !== netparser.ip(sn)) {
															return this.setState({ isValidCIDR: false });
														}
													}
													this.setState({ isValidCIDR: true });
												}}
												intent={this.state.isValidCIDR ? Intent.NONE : Intent.DANGER}
											/>
											<Button
												id={"scannerInputButton"}
												icon="satellite"
												style={{ width: "90px", marginTop: "5px", marginRight: "15px", marginBottom: "5px" }}
												onClick={() =>
													this.props.triggers.startScanning(
														(document.getElementById("scanner-input") as HTMLInputElement).value
													)
												}
											>
												{"Scan"}
											</Button>
										</div>
										{this.getScannerButtons()}
									</Menu>
								}
								target={<Button icon="geosearch">{this.state.clientWidth >= 866 ? "Scanner" : ""}</Button>}
							/>
							<Button icon="code" onClick={() => window.open("https://github.com/demskie/ipam")}>
								{this.state.clientWidth >= 801 ? "Source" : ""}
							</Button>
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
											disabled={true}
											alignIndicator={Alignment.RIGHT}
											onChange={this.props.triggers.toggleNotifications}
										/>
										<Switch
											label="Save Login"
											checked={this.props.cacheLogin}
											disabled={true}
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
							{this.props.websocket.isConnected() ? `${this.state.latency}ms` : "Offline"}
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
