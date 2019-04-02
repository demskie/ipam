import React from "react";

import { MainTriggers } from "../../Main";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode } from "../SubnetPrompt";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, InputGroup, IPanelProps } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";

interface ModifyPanelProps {
	darkMode: boolean;
	selectedTreeNode: Subnet;
	getUsername: MainTriggers["getUsername"];
	getPassword: MainTriggers["getPassword"];
	modifySubnet: MainTriggers["modifySubnet"];
	exitSubnetPrompt: () => void;
}

export class ModifyPanel extends React.PureComponent<IPanelProps & ModifyPanelProps> {
	render() {
		return (
			<React.Fragment>
				<SubnetInputGroups
					darkMode={this.props.darkMode}
					subnetPromptMode={SubnetPromptMode.MODIFY}
					selectedTreeNode={this.props.selectedTreeNode}
				/>
				<Flex justify={"space-between"} style={{ marginLeft: "15px", marginRight: "15px", marginBottom: "10px" }}>
					<Box style={{ width: "135px" }}>
						<InputGroup id="username-input-modify" placeholder="username" defaultValue={this.props.getUsername()} />
					</Box>
					<Box style={{ width: "135px" }}>
						<InputGroup
							id="password-input-modify"
							placeholder="password"
							type="password"
							defaultValue={this.props.getPassword()}
						/>
					</Box>
					<Box>
						<Button
							intent={Intent.WARNING}
							onClick={() => {
								this.props.modifySubnet({
									user: (document.getElementById("username-input-modify") as HTMLInputElement).value,
									pass: (document.getElementById("password-input-modify") as HTMLInputElement).value,
									net: (document.getElementById("cidr-input-modify") as HTMLInputElement).value,
									desc: (document.getElementById("desc-input-modify") as HTMLInputElement).value,
									notes: (document.getElementById("notes-input-modify") as HTMLInputElement).value,
									vlan: (document.getElementById("vlan-input-modify") as HTMLInputElement).value
								});
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
