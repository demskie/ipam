import React from "react";
import fscreen from "fscreen";
import _ from "lodash-es";
import { Button, Navbar, NavbarGroup, Alignment, Alert, InputGroup } from "@blueprintjs/core";
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
				<Navbar className="bp3-dark" style={{ paddingLeft: "5px", paddingRight: "5px" }}>
					<NavbarGroup align={Alignment.LEFT}>
						<Button
							className="bp3-minimal bp3-large"
							icon="menu"
							disabled={false}
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
							className="bp3-minimal"
							icon="info-sign"
							style={{ marginLeft: "15px", marginRight: "5px" }}
							onClick={() => this.props.triggers.setAdvancedPromptMode(AdvancedPromptMode.HISTORY)}
						/>
						<Button
							className="bp3-minimal"
							icon="fullscreen"
							style={{ marginRight: "5px" }}
							onClick={this.requestFullscreen}
							disabled={this.state.fullscreenDisabled}
						/>
					</NavbarGroup>
				</Navbar>
				<Alert
					className="bp3-dark"
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
