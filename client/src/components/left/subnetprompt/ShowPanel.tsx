import React from "react";

import { MainTriggers } from "../../Main";
import { WebsocketManager } from "../../websocket/WebsocketManager";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode, subnetPromptFirstRender } from "../SubnetPrompt";
import { ModifyPanel } from "./ModifyPanel";
import { DeletePanel } from "./DeletePanel";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, IPanelProps } from "@blueprintjs/core";

export interface ShowPanelProps {
	rootSubnetPromptMode: SubnetPromptMode;
	selectedTreeNode: Subnet;
	websocket: WebsocketManager;
	createSubnet: MainTriggers["createSubnet"];
	modifySubnet: MainTriggers["modifySubnet"];
	deleteSubnet: MainTriggers["deleteSubnet"];
	exitSubnetPrompt: () => void;
}

interface ShowPanelState {}

export class ShowPanel extends React.Component<IPanelProps & ShowPanelProps, ShowPanelState> {
	autoOpenSubmenus = () => {
		if (subnetPromptFirstRender.value) {
			const isRootModify = this.props.rootSubnetPromptMode === SubnetPromptMode.MODIFY;
			const isRootDelete = this.props.rootSubnetPromptMode === SubnetPromptMode.DELETE;
			if (isRootModify) {
				this.props.openPanel({
					component: ModifyPanel,
					props: this.props,
					title: "Modify Subnet"
				});
			} else if (isRootDelete) {
				this.props.openPanel({
					component: DeletePanel,
					props: this.props,
					title: "Delete Subnet"
				});
			}
			subnetPromptFirstRender.value = false;
		}
	};

	render() {
		setTimeout(() => this.autoOpenSubmenus(), 250);
		return (
			<React.Fragment>
				<SubnetInputGroups subnetPromptMode={SubnetPromptMode.SHOW} selectedTreeNode={this.props.selectedTreeNode} />
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
