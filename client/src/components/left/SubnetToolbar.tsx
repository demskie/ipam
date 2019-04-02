import React from "react";

import { Navbar, NavbarGroup, Alignment, Button } from "@blueprintjs/core";
import { MainState as SubnetToolbarProps } from "../Main";
import { SubnetPromptMode } from "./SubnetPrompt";

interface SubnetToolbarState {}

export class SubnetToolbar extends React.PureComponent<SubnetToolbarProps, SubnetToolbarState> {
	render() {
		return (
			<Navbar
				id="subnetToolbar"
				className={this.props.darkMode ? "bp3-dark" : "light-mode-background-color-second"}
				fixedToTop={true}
				style={{ top: this.props.sidebarDocked ? "0px" : "50px" }}
			>
				<NavbarGroup align={Alignment.LEFT}>
					<Button
						className={this.props.darkMode ? "" : "light-mode-background-color-first no-box-shadow"}
						style={{ margin: "5px", width: "90px" }}
						minimal={this.props.darkMode}
						icon="add"
						text="Create"
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.CREATE)}
					/>
					<Button
						className={this.props.darkMode ? "" : "light-mode-background-color-first no-box-shadow"}
						style={{ margin: "5px", width: "90px" }}
						minimal={this.props.darkMode}
						icon="annotation"
						text="Modify"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.MODIFY)}
					/>
					<Button
						className={this.props.darkMode ? "" : "light-mode-background-color-first no-box-shadow"}
						style={{ margin: "5px", width: "90px" }}
						minimal={this.props.darkMode}
						icon="remove"
						text="Delete"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.DELETE)}
					/>
					<Button
						className={this.props.darkMode ? "" : "light-mode-background-color-first no-box-shadow"}
						style={{ margin: "5px", width: "90px" }}
						minimal={this.props.darkMode}
						icon="eye-open"
						text="Show"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.SHOW)}
					/>
					<Button
						className={this.props.darkMode ? "" : "light-mode-background-color-first no-box-shadow"}
						style={{ margin: "5px", width: "90px" }}
						minimal={this.props.darkMode}
						icon="geosearch"
						text="Scan"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.startScan(this.props.selectedTreeNode.net)}
					/>
				</NavbarGroup>
			</Navbar>
		);
	}
}
