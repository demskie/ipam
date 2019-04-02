import React from "react";

import { MainState as SubnetPromptProps } from "../Main";
import { CreatePanel, CreatePanelProps } from "./subnetprompt/CreatePanel";
import { ShowPanel, ShowPanelProps } from "./subnetprompt/ShowPanel";

import { Dialog, Classes, PanelStack, IPanel } from "@blueprintjs/core";
import { default as classNames } from "classnames";

export enum SubnetPromptMode {
	CLOSED,
	SHOW,
	CREATE,
	MODIFY,
	DELETE
}

interface SubnetPromptState {}

export var subnetPromptFirstRender = { value: true };

export class SubnetPrompt extends React.Component<SubnetPromptProps, SubnetPromptState> {
	closeSubnetPrompt = () => {
		subnetPromptFirstRender.value = true;
		this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.CLOSED);
	};

	resetRootSubnetPromptMode = () => {
		this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.SHOW);
	};

	getPanelComponent = () => {
		return this.props.rootSubnetPromptMode === SubnetPromptMode.CREATE ? CreatePanel : ShowPanel;
	};

	getModifiedProps = () => {
		return {
			darkMode: this.props.darkMode,
			rootSubnetPromptMode: this.props.rootSubnetPromptMode,
			selectedTreeNode: this.props.selectedTreeNode,
			getUsername: this.props.triggers.getUsername,
			getPassword: this.props.triggers.getPassword,
			createSubnet: this.props.triggers.createSubnet,
			modifySubnet: this.props.triggers.modifySubnet,
			deleteSubnet: this.props.triggers.deleteSubnet,
			exitSubnetPrompt: this.closeSubnetPrompt
		} as CreatePanelProps & ShowPanelProps;
	};

	getPanelTitle = () => {
		return this.props.rootSubnetPromptMode === SubnetPromptMode.CREATE ? "Create Subnet" : "Show Subnet";
	};

	render() {
		return (
			<Dialog
				className={this.props.darkMode ? "bp3-dark" : ""}
				isOpen={this.props.rootSubnetPromptMode !== SubnetPromptMode.CLOSED}
				onClose={this.closeSubnetPrompt}
				onOpened={this.resetRootSubnetPromptMode}
			>
				<div className={Classes.DIALOG_BODY} style={{ marginBottom: "0px" }}>
					<PanelStack
						className="subnetPromptPanelStack"
						initialPanel={{
							component: this.getPanelComponent(),
							props: this.getModifiedProps(),
							title: this.getPanelTitle()
						}}
					/>
				</div>
			</Dialog>
		);
	}
}
