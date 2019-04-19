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
				className={this.props.darkMode ? "bp3-dark" : "light-mode-background-color-first"}
				fixedToTop={false}
				style={{ top: this.props.sidebarDocked ? "0px" : "50px" }}
			>
				<NavbarGroup align={Alignment.LEFT}>
					<Button
						className={
							this.props.darkMode
								? "dark-mode-background-color-second no-box-shadow round-borders"
								: "light-mode-background-color-second no-box-shadow round-borders"
						}
						style={{ margin: "5px", width: "90px" }}
						icon="add"
						text="Create"
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.CREATE)}
					/>
					<Button
						className={
							this.props.darkMode
								? "dark-mode-background-color-second no-box-shadow round-borders"
								: "light-mode-background-color-second no-box-shadow round-borders"
						}
						style={{ margin: "5px", width: "90px" }}
						icon="annotation"
						text="Modify"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.MODIFY)}
					/>
					<Button
						className={
							this.props.darkMode
								? "dark-mode-background-color-second no-box-shadow round-borders"
								: "light-mode-background-color-second no-box-shadow round-borders"
						}
						style={{ margin: "5px", width: "90px" }}
						icon="remove"
						text="Delete"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.DELETE)}
					/>
					<Button
						className={
							this.props.darkMode
								? "dark-mode-background-color-second no-box-shadow round-borders"
								: "light-mode-background-color-second no-box-shadow round-borders"
						}
						style={{ margin: "5px", width: "90px" }}
						icon="eye-open"
						text="Show"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.SHOW)}
					/>
					<Button
						className={
							this.props.darkMode
								? "dark-mode-background-color-second no-box-shadow round-borders"
								: "light-mode-background-color-second no-box-shadow round-borders"
						}
						style={{ margin: "5px", width: "90px" }}
						icon="satellite"
						text="Scan"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.startScanning(this.props.selectedTreeNode.net)}
					/>
				</NavbarGroup>
			</Navbar>
		);
	}
}
