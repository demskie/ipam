import React from "react";
import debounce from "debounce";
import { Flex, Box } from "reflexbox";
import fscreen from "fscreen";
import {
	Button,
	Navbar,
	NavbarGroup,
	Alignment,
	InputGroup,
	Alert,
	Position,
	Popover,
	PopoverInteractionKind,
	Menu,
	MenuItem
} from "@blueprintjs/core";

export class CustomToolbar extends React.Component {
	constructor() {
		super();
		this.state = {
			createButtonDisabled: false,
			selectedSearchOption: "Subnet Tree",
			modifyButtonDisabled: true,
			deleteButtonDisabled: true,
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
		const searchOptionsMenu = (
			<Popover
				content={
					<Menu>
						<MenuItem text="Subnet Tree" onClick={this.selectSubnetTreeOption} />
						<MenuItem text="DNS Records" onClick={this.selectDNSRecordsOption} />
						<MenuItem text="Changelog" onClick={this.selectChangelogOption} />
					</Menu>
				}
				interactionKind={PopoverInteractionKind.HOVER}
				position={Position.BOTTOM}
			>
				<Button className="bp3-minimal" rightIcon="caret-down" text={this.state.selectedSearchOption} />
			</Popover>
		);
		return (
			<div style={{ height: "50px" }}>
				<Navbar className="bp3-dark">
					<NavbarGroup align={Alignment.LEFT}>
						<div className="bp3-navbar-heading">
							<b>IPAM</b>
						</div>

						<Button
							className="bp3-minimal"
							icon="add"
							text="Create"
							disabled={this.state.createButtonDisabled}
						/>

						<Button
							className="bp3-minimal"
							icon="annotation"
							text="Modify"
							disabled={this.state.modifyButtonDisabled}
						/>

						<Button
							className="bp3-minimal"
							icon="remove"
							text="Delete"
							disabled={this.state.deleteButtonDisabled}
						/>
					</NavbarGroup>

					<NavbarGroup align={Alignment.RIGHT}>
						<InputGroup
							className="bp3-dark"
							leftIcon="search"
							placeholder="Search"
							type="search"
							rightElement={searchOptionsMenu}
						/>
						<div style={{ marginLeft: "30px" }} />
						<Button className="bp3-minimal" icon="property" text="" />

						<Button className="bp3-minimal" icon="cog" text="" />

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
