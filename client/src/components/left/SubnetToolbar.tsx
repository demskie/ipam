import React from "react";

import { Subnet } from "./SubnetTree";
import { Navbar, NavbarGroup, Alignment, Button } from "@blueprintjs/core";
import { MainState as SubnetToolbarProps } from "../Main";
import { SubnetPromptMode } from "./SubnetPrompt";

interface SubnetToolbarState {}

export class SubnetToolbar extends React.PureComponent<SubnetToolbarProps, SubnetToolbarState> {
	render() {
		return (
			<Navbar
				id="subnetToolbar"
				className="bp3-dark"
				fixedToTop={true}
				style={{ top: this.props.sidebarDocked ? "0px" : "50px" }}
			>
				<NavbarGroup align={Alignment.LEFT}>
					<Button
						className="bp3-minimal"
						icon="add"
						text="Create"
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.CREATE)}
					/>
					<Button
						className="bp3-minimal"
						icon="annotation"
						text="Modify"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.MODIFY)}
					/>
					<Button
						className="bp3-minimal"
						icon="remove"
						text="Delete"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.DELETE)}
					/>
					<Button
						className="bp3-minimal"
						icon="eye-open"
						text="Show"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.SHOW)}
					/>
					<Button
						className="bp3-minimal"
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
