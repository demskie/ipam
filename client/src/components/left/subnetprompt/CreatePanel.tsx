import React from "react";

import { MainTriggers } from "../../Main";
import { WebsocketManager } from "../../websocket/Manager";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode } from "../SubnetPrompt";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, InputGroup, IPanelProps } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";

export interface CreatePanelProps {
	selectedTreeNode: Subnet;
	websocket: WebsocketManager;
	createSubnet: MainTriggers["createSubnet"];
	exitSubnetPrompt: () => void;
}

export class CreatePanel extends React.PureComponent<IPanelProps & CreatePanelProps> {
	render() {
		return (
			<React.Fragment>
				<SubnetInputGroups subnetPromptMode={SubnetPromptMode.CREATE} selectedTreeNode={this.props.selectedTreeNode} />
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
							intent={Intent.SUCCESS}
							onClick={() => {
								this.props.createSubnet(
									(window.document.getElementById("username-input") as HTMLInputElement).value,
									(window.document.getElementById("password-input") as HTMLInputElement).value,
									{
										id: "",
										childNodes: [],
										modTime: "",
										label: "",
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
							{"Create Subnet"}
						</Button>
					</Box>
				</Flex>
			</React.Fragment>
		);
	}
}
