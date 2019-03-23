import React from "react";

import { MainState as SubnetPromptProps } from "../Main";
import { CreatePanel, CreatePanelProps } from "./subnetprompt/CreatePanel";
import { ShowPanel, ShowPanelProps } from "./subnetprompt/ShowPanel";

import { Dialog, Classes, PanelStack } from "@blueprintjs/core";
import { default as classNames } from "classnames";

export enum SubnetPromptMode {
	CLOSED,
	SHOW,
	CREATE,
	MODIFY,
	DELETE
}

interface SubnetPromptState {
	// actualPanel: SubnetPromptMode;
}

export class SubnetPrompt extends React.PureComponent<SubnetPromptProps, SubnetPromptState> {
	// constructor(props: SubnetPromptProps) {
	// 	super(props);
	// 	this.state = { actualPanel: props.rootSubnetPromptMode };
	// }

	// shouldComponentUpdate(nextProps: SubnetPromptProps, nextState: SubnetPromptState) {
	// 	if (nextProps.rootSubnetPromptMode !== SubnetPromptMode.CLOSED) {
	// 		if (nextProps.rootSubnetPromptMode !== this.props.rootSubnetPromptMode) {
	// 			this.setState({ actualPanel: this.props.rootSubnetPromptMode });
	// 			return false;
	// 		}
	// 	}
	// 	return true;
	// }

	render() {
		return (
			<Dialog
				className={classNames(Classes.DARK)}
				isOpen={this.props.rootSubnetPromptMode !== SubnetPromptMode.CLOSED}
				onClose={() => this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.CLOSED)}
			>
				<div className={Classes.DIALOG_BODY} style={{ marginBottom: "0px" }}>
					{(() => {
						let panelTitle: string;
						let panelProps: CreatePanelProps | ShowPanelProps;
						if (this.props.rootSubnetPromptMode === SubnetPromptMode.CREATE) {
							panelTitle = "Create Subnet";
							panelProps = {};
						} else {
							panelTitle = "Show Subnet";
							panelProps = {
								rootSubnetPromptMode: this.props.rootSubnetPromptMode,
								subnetPromptMode: this.state.actualPanel
							};
						}
						return (
							<PanelStack
								className="subnetPromptPanelStack"
								initialPanel={{ component: ShowPanel, props: panelProps, title: panelTitle }}
							/>
						);
					})()}
				</div>
			</Dialog>
		);
	}
}
