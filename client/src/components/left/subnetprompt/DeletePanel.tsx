import React from "react";

import { MainTriggers } from "../../Main";
import { Subnet } from "../SubnetTree";
import { SubnetPromptMode } from "../SubnetPrompt";
import { SubnetInputGroups } from "./InputGroups";

import { Button, Intent, InputGroup, IPanelProps } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";

interface DeletePanelProps {
	darkMode: boolean;
	selectedTreeNode: Subnet;
	getUsername: MainTriggers["getUsername"];
	getPassword: MainTriggers["getPassword"];
	deleteSubnet: MainTriggers["deleteSubnet"];
	exitSubnetPrompt: () => void;
}

export class DeletePanel extends React.PureComponent<IPanelProps & DeletePanelProps> {
	render() {
		return (
			<React.Fragment>
				<SubnetInputGroups
					darkMode={this.props.darkMode}
					subnetPromptMode={SubnetPromptMode.DELETE}
					selectedTreeNode={this.props.selectedTreeNode}
				/>
				<Flex justify={"space-between"} style={{ marginLeft: "15px", marginRight: "15px", marginBottom: "10px" }}>
					<Box style={{ width: "135px" }}>
						<InputGroup id="username-input-delete" placeholder="username" defaultValue={this.props.getUsername()} />
					</Box>
					<Box style={{ width: "135px" }}>
						<InputGroup
							id="password-input-delete"
							placeholder="password"
							defaultValue={this.props.getPassword()}
							type="password"
						/>
					</Box>
					<Box>
						<Button
							intent={Intent.DANGER}
							onClick={() => {
								this.props.deleteSubnet({
									user: (document.getElementById("username-input-delete") as HTMLInputElement).value,
									pass: (document.getElementById("password-input-delete") as HTMLInputElement).value,
									net: (document.getElementById("cidr-input-delete") as HTMLInputElement).value,
									desc: (document.getElementById("desc-input-delete") as HTMLInputElement).value,
									notes: (document.getElementById("notes-input-delete") as HTMLInputElement).value,
									vlan: (document.getElementById("vlan-input-delete") as HTMLInputElement).value
								});
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
