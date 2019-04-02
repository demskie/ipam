import React from "react";

import { MainTriggers } from "../../Main";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode } from "../SubnetPrompt";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, InputGroup, IPanelProps } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";

export interface CreatePanelProps {
	darkMode: boolean;
	selectedTreeNode: Subnet;
	getUsername: MainTriggers["getUsername"];
	getPassword: MainTriggers["getPassword"];
	createSubnet: MainTriggers["createSubnet"];
	exitSubnetPrompt: () => void;
}

export class CreatePanel extends React.PureComponent<IPanelProps & CreatePanelProps> {
	render() {
		return (
			<React.Fragment>
				<SubnetInputGroups
					darkMode={this.props.darkMode}
					subnetPromptMode={SubnetPromptMode.CREATE}
					selectedTreeNode={this.props.selectedTreeNode}
				/>
				<Flex justify={"space-between"} style={{ marginLeft: "15px", marginRight: "15px", marginBottom: "10px" }}>
					<Box style={{ width: "135px" }}>
						<InputGroup id="username-input-create" placeholder="username" defaultValue={this.props.getUsername()} />
					</Box>
					<Box style={{ width: "135px" }}>
						<InputGroup
							id="password-input-create"
							placeholder="password"
							type="password"
							defaultValue={this.props.getPassword()}
						/>
					</Box>
					<Box>
						<Button
							intent={Intent.SUCCESS}
							onClick={() => {
								this.props.createSubnet({
									user: (document.getElementById("username-input-create") as HTMLInputElement).value,
									pass: (document.getElementById("password-input-create") as HTMLInputElement).value,
									net: (document.getElementById("cidr-input-create") as HTMLInputElement).value,
									desc: (document.getElementById("desc-input-create") as HTMLInputElement).value,
									notes: (document.getElementById("notes-input-create") as HTMLInputElement).value,
									vlan: (document.getElementById("vlan-input-create") as HTMLInputElement).value
								});
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
