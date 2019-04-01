import React from "react";

import { MainTriggers } from "../../Main";
import { WebsocketManager } from "../../websocket/WebsocketManager";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode } from "../SubnetPrompt";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, InputGroup, IPanelProps } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";

interface ModifyPanelProps {
	selectedTreeNode: Subnet;
	websocket: WebsocketManager;
	modifySubnet: MainTriggers["modifySubnet"];
	exitSubnetPrompt: () => void;
}

export class ModifyPanel extends React.PureComponent<IPanelProps & ModifyPanelProps> {
	render() {
		return (
			<React.Fragment>
				<SubnetInputGroups subnetPromptMode={SubnetPromptMode.MODIFY} selectedTreeNode={this.props.selectedTreeNode} />
				<Flex justify={"space-between"} style={{ marginLeft: "15px", marginRight: "15px", marginBottom: "10px" }}>
					<Box style={{ width: "135px" }}>
						<InputGroup id="username-input" placeholder="username" defaultValue={this.props.websocket.getUsername()} />
					</Box>
					<Box style={{ width: "135px" }}>
						<InputGroup
							id="password-input"
							placeholder="password"
							type="password"
							defaultValue={this.props.websocket.getPassword()}
						/>
					</Box>
					<Box>
						<Button
							intent={Intent.WARNING}
							onClick={() => {
								this.props.modifySubnet(
									(window.document.getElementById("username-input") as HTMLInputElement).value,
									(window.document.getElementById("password-input") as HTMLInputElement).value,
									{
										id: this.props.selectedTreeNode.id,
										childNodes: this.props.selectedTreeNode.childNodes,
										modTime: this.props.selectedTreeNode.modTime,
										label: this.props.selectedTreeNode.label,
										net: (document.getElementById("cidr-input") as HTMLInputElement).value,
										desc: (document.getElementById("description-input") as HTMLInputElement).value,
										notes: (document.getElementById("notes-input") as HTMLInputElement).value,
										vlan: (document.getElementById("vlan-input") as HTMLInputElement).value
									}
								);
								this.props.exitSubnetPrompt();
							}}
							style={{ width: "120px" }}
						>
							{"Modify Subnet"}
						</Button>
					</Box>
				</Flex>
			</React.Fragment>
		);
	}
}
