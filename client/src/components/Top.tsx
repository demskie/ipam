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
	Colors
} from "@blueprintjs/core";

import { MainState as TopProps } from "./Main";
import { AdvancedPromptMode } from "./AdvancedPrompt";

class TopState {
	fullscreenDisabled = false;
	fullscreenAlertIsOpen = false;
}

export class Top extends React.Component<TopProps, TopState> {
	state = new TopState();

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
				<Navbar
					className={this.props.darkMode ? "bp3-dark" : "bp3-dark"}
					style={{ paddingLeft: "5px", paddingRight: "5px", minWidth: "620px" }}
				>
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
							style={{ width: "260px" }}
						/>
					</NavbarGroup>
					<NavbarGroup align={Alignment.RIGHT}>
						<Button
							icon="info-sign"
							minimal={true}
							style={{ marginRight: "10px" }}
							onClick={() => this.props.triggers.setAdvancedPromptMode(AdvancedPromptMode.HISTORY)}
						/>
						<Popover
							isOpen={false}
							position={"bottom"}
							content={
								<Menu>
									<MenuItem text="Hello" />
									<MenuItem text="World" />
									<MenuItem text="Hello" />
									<MenuItem text="World" />
									<MenuItem text="Hello" />
									<MenuItem text="World" />
									<MenuItem text="Hello" />
									<MenuItem text="World" />
									<MenuItem text="Hello" />
									<MenuItem text="World" />
								</Menu>
							}
							target={
								<Button
									icon="cog"
									minimal={true}
									style={{ marginRight: "5px" }}
									onClick={() => console.log("Settings button was pressed")}
								/>
							}
						/>

						<Button
							style={{
								marginLeft: "10px",
								marginRight: "10px",
								borderRadius: "25px",
								// color: this.props.websocket.isConnected() ? "rgba(0, 180, 0, 1)" : "rgba(255, 0, 0, 1)",
								width: "75px"
								//background: "rgba(16, 22, 26, 0.3)"
							}}
							minimal={true}
							active={true}
							onClick={() => console.log("Connection button was pressed")}
						>
							{this.props.websocket.isConnected() ? "Online" : "Offline"}
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
