import React from "react";

import { MainTriggers } from "../../Main";
import { WebsocketManager } from "../../websocket/Manager";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode } from "../SubnetPrompt";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, InputGroup, IPanelProps } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";

interface DeletePanelProps {
	selectedTreeNode: Subnet;
	websocket: WebsocketManager;
	deleteSubnet: MainTriggers["deleteSubnet"];
	exitSubnetPrompt: () => void;
}

export class DeletePanel extends React.PureComponent<IPanelProps & DeletePanelProps> {
	render() {
		return (
			<React.Fragment>
				<SubnetInputGroups subnetPromptMode={SubnetPromptMode.DELETE} selectedTreeNode={this.props.selectedTreeNode} />
				<Flex justify={"space-between"} style={{ marginLeft: "15px", marginRight: "15px", marginBottom: "10px" }}>
					<Box style={{ width: "135px" }}>
						<InputGroup id="username-input" placeholder="username" defaultValue={this.props.websocket.getUsername()} />
					</Box>
					<Box style={{ width: "135px" }}>
						<InputGroup
							id="password-input"
							placeholder="password"
							defaultValue={this.props.websocket.getPassword()}
							type="password"
						/>
					</Box>
					<Box>
						<Button
							intent={Intent.DANGER}
							onClick={() => {
								this.props.deleteSubnet(
									(window.document.getElementById("username-input") as HTMLInputElement).value,
									(window.document.getElementById("password-input") as HTMLInputElement).value,
									Object.assign({}, this.props.selectedTreeNode)
								);
								this.props.exitSubnetPrompt();
							}}
							style={{ width: "120px" }}
						>
							{"Delete Subnet"}
						</Button>
					</Box>
				</Flex>
			</React.Fragment>
		);
	}
}
