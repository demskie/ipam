import React from "react";

import { MainTriggers } from "../../Main";
import { WebsocketManager } from "../../websocket/Manager";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode } from "../SubnetPrompt";
import { ModifyPanel } from "./ModifyPanel";
import { DeletePanel } from "./DeletePanel";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, IPanelProps } from "@blueprintjs/core";

export interface ShowPanelProps {
	rootSubnetPromptMode: SubnetPromptMode;
	subnetPromptMode: SubnetPromptMode;
	selectedTreeNode: Subnet;
	triggerSubnetPromptMode: (mode: SubnetPromptMode) => void;
	websocket: WebsocketManager;
	createSubnet: MainTriggers["createSubnet"];
	modifySubnet: MainTriggers["modifySubnet"];
	deleteSubnet: MainTriggers["deleteSubnet"];
	exitSubnetPrompt: () => void;
}

interface ShowPanelState {
	initialExecution: boolean;
}

export class ShowPanel extends React.PureComponent<IPanelProps & ShowPanelProps, ShowPanelState> {
	state = {
		initialExecution: true
	};

	render() {
		const isModify = this.props.subnetPromptMode === SubnetPromptMode.MODIFY;
		const isDelete = this.props.subnetPromptMode === SubnetPromptMode.DELETE;
		if (this.state.initialExecution) {
			if (isModify) {
				console.log("triggering ModifyPanel");
				this.setState({ initialExecution: false }, () => {
					this.props.openPanel({
						component: ModifyPanel,
						props: this.props,
						title: "Modify Subnet"
					});
				});
			} else if (isDelete) {
				this.setState({ initialExecution: false }, () => {
					this.props.openPanel({
						component: DeletePanel,
						props: this.props,
						title: "Delete Subnet"
					});
				});
			}
		}
		return (
			<React.Fragment>
				<SubnetInputGroups
					rootSubnetPromptMode={this.props.rootSubnetPromptMode}
					subnetPromptMode={SubnetPromptMode.SHOW}
					selectedTreeNode={this.props.selectedTreeNode}
					triggerSubnetPromptMode={this.props.triggerSubnetPromptMode}
				/>
				<div>
					<Button
						intent={Intent.NONE}
						onClick={() => console.log("'Show Children' was clicked")}
						style={{ width: "120px", marginLeft: "15px", marginBottom: "10px" }}
						disabled={true}
					>
						{"Show Children"}
					</Button>
					<div style={{ float: "right" }}>
						<Button
							intent={Intent.WARNING}
							onClick={() => {
								this.props.openPanel({
									component: ModifyPanel,
									props: this.props,
									title: "Modify Subnet"
								});
							}}
							style={{ width: "75px", marginRight: "15px", marginBottom: "10px" }}
						>
							{"Modify"}
						</Button>
						<Button
							intent={Intent.DANGER}
							onClick={() => {
								this.props.openPanel({
									component: DeletePanel,
									props: this.props,
									title: "Delete Subnet"
								});
							}}
							style={{ width: "75px", marginRight: "15px", marginBottom: "10px" }}
						>
							{"Delete"}
						</Button>
					</div>
				</div>
			</React.Fragment>
		);
	}
}
