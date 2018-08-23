import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Button, Intent, Label, TextArea, InputGroup, Tooltip, Position } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";

export class SubnetPrompt extends React.PureComponent {
	create = () => {
		return (
			<Dialog
				className={Classes.DARK}
				title=""
				isOpen={this.props.subnetPromptEnabled}
				onClose={() => {
					this.props.handleUserAction({ action: "closeSubnetPrompt" });
				}}
			>
				<div className={Classes.DIALOG_BODY}>
					<Flex justify="center">
						<Box p={2}>
							<Label>
								Subnet CIDR
								<InputGroup
									id="cidr-input"
									placeholder="192.168.0.0/24"
									rightElement={
										<Tooltip
											className="bp3-dark"
											content={subnetCheatsheet}
											position={Position.RIGHT}
											intent={Intent.NONE}
										>
											{<Button className="bp3-minimal" icon="help" />}
										</Tooltip>
									}
								/>
							</Label>
							<Label>
								Description
								<InputGroup id="description-input" placeholder="mcsubnettyface" />
							</Label>
							<Label>
								VLAN ID
								<InputGroup id="vlan-input" placeholder="1002" />
							</Label>
						</Box>
						<Box p={2}>
							<Label>
								Scratch Notes
								<TextArea
									id="notes-input"
									large={false}
									style={{ width: "210px", maxWidth: "210px", height: "165px" }}
								/>
							</Label>
						</Box>
					</Flex>
				</div>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button
						intent={Intent.SUCCESS}
						onClick={() => {
							this.props.handleUserAction({
								action: "create",
								nodeData: {
									net: document.getElementById("cidr-input").value,
									desc: document.getElementById("description-input").value,
									notes: document.getElementById("notes-input").value,
									vlan: document.getElementById("vlan-input").value
								}
							});
						}}
						style={{ marginRight: "40px", marginBottom: "10px" }}
					>
						Create Subnet
					</Button>
				</div>
			</Dialog>
		);
	};
	modify = () => {
		return (
			<Dialog
				className={Classes.DARK}
				title=""
				isOpen={this.props.subnetPromptEnabled}
				onClose={() => {
					this.props.handleUserAction({ action: "closeSubnetPrompt" });
				}}
			>
				<div className={Classes.DIALOG_BODY}>
					<Flex justify="center">
						<Box p={2}>
							<Label>
								Subnet CIDR
								<InputGroup
									id="cidr-input"
									placeholder=""
									value={this.props.selectedTreeNode.net}
									disabled={true}
									rightElement={
										<Tooltip
											className="bp3-dark"
											content={subnetCheatsheet}
											position={Position.RIGHT}
											intent={Intent.NONE}
										>
											{<Button className="bp3-minimal" icon="help" />}
										</Tooltip>
									}
								/>
							</Label>
							<Label>
								Description
								<InputGroup
									id="description-input"
									placeholder=""
									defaultValue={this.props.selectedTreeNode.desc}
									onChange={ev => {
										document.getElementById("description-input").value = ev.target.value;
									}}
								/>
							</Label>
							<Label>
								VLAN ID
								<InputGroup
									id="vlan-input"
									placeholder=""
									defaultValue={this.props.selectedTreeNode.vlan}
									onChange={ev => {
										document.getElementById("vlan-input").value = ev.target.value;
									}}
								/>
							</Label>
						</Box>
						<Box p={2}>
							<Label>
								Scratch Notes
								<TextArea
									id="notes-input"
									large={false}
									style={{ width: "210px", maxWidth: "210px", height: "165px" }}
									defaultValue={this.props.selectedTreeNode.notes}
									onChange={ev => {
										document.getElementById("notes-input").value = ev.target.value;
									}}
								/>
							</Label>
						</Box>
					</Flex>
				</div>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button
						intent={Intent.WARNING}
						onClick={() => {
							this.props.handleUserAction({
								action: "modify",
								nodeData: {
									net: document.getElementById("cidr-input").value,
									desc: document.getElementById("description-input").value,
									notes: document.getElementById("notes-input").value,
									vlan: document.getElementById("vlan-input").value
								}
							});
						}}
						style={{ marginRight: "40px", marginBottom: "10px" }}
					>
						Modify Subnet
					</Button>
				</div>
			</Dialog>
		);
	};
	eliminate = () => {
		return (
			<Dialog
				className={Classes.DARK}
				title=""
				isOpen={this.props.subnetPromptEnabled}
				onClose={() => {
					this.props.handleUserAction({ action: "closeSubnetPrompt" });
				}}
			>
				<div className={Classes.DIALOG_BODY}>
					<Flex justify="center">
						<Box p={2}>
							<Label>
								Subnet CIDR
								<InputGroup
									id="cidr-input"
									placeholder=""
									value={this.props.selectedTreeNode.net}
									disabled={true}
									rightElement={
										<Tooltip
											className="bp3-dark"
											content={subnetCheatsheet}
											position={Position.RIGHT}
											intent={Intent.NONE}
										>
											{<Button className="bp3-minimal" icon="help" />}
										</Tooltip>
									}
								/>
							</Label>
							<Label>
								Description
								<InputGroup
									id="description-input"
									placeholder=""
									value={this.props.selectedTreeNode.desc}
									disabled={true}
								/>
							</Label>
							<Label>
								VLAN ID
								<InputGroup id="vlan-input" placeholder="" value={this.props.selectedTreeNode.vlan} disabled={true} />
							</Label>
						</Box>
						<Box p={2}>
							<Label>
								Scratch Notes
								<TextArea
									id="notes-input"
									large={false}
									style={{ width: "210px", maxWidth: "210px", height: "165px" }}
									value={this.props.selectedTreeNode.notes}
									disabled={true}
								/>
							</Label>
						</Box>
					</Flex>
				</div>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button
						intent={Intent.DANGER}
						onClick={() => {
							this.props.handleUserAction({
								action: "delete",
								nodeData: {
									net: document.getElementById("cidr-input").value,
									desc: document.getElementById("description-input").value,
									notes: document.getElementById("notes-input").value,
									vlan: document.getElementById("vlan-input").value
								}
							});
						}}
						style={{ marginRight: "40px", marginBottom: "10px" }}
					>
						Delete Subnet
					</Button>
				</div>
			</Dialog>
		);
	};
	render() {
		switch (this.props.subnetPromptAction) {
			case "create":
				return this.create();
			case "modify":
				return this.modify();
			case "delete":
				return this.eliminate();
			default:
				return null;
		}
	}
}

SubnetPrompt.propTypes = {
	handleUserAction: PropTypes.func.isRequired,
	selectedTreeNode: PropTypes.object.isRequired,
	subnetPromptAction: PropTypes.string.isRequired,
	subnetPromptEnabled: PropTypes.bool.isRequired
};

const subnetCheatsheet = (
	<table>
		<tbody>
			<tr>
				<td>
					{"CIDR"}
					{"\u00A0\u00A0\u00A0"}
				</td>
				<td>
					{"SubnetMask"}
					{"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
					{"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
				</td>
				<td>{"Hosts"}</td>
			</tr>
			<tr>
				<td>{"/32"}</td>
				<td>{"255.255.255.255"}</td>
				<td>{"1"}</td>
			</tr>
			<tr>
				<td>{"/31"}</td>
				<td>{"255.255.255.254"}</td>
				<td>{"2"}</td>
			</tr>
			<tr>
				<td>{"/30"}</td>
				<td>{"255.255.255.252"}</td>
				<td>{"4"}</td>
			</tr>
			<tr>
				<td>{"/29"}</td>
				<td>{"255.255.255.248"}</td>
				<td>{"8"}</td>
			</tr>
			<tr>
				<td>{"/28"}</td>
				<td>{"255.255.255.240"}</td>
				<td>{"16"}</td>
			</tr>
			<tr>
				<td>{"/27"}</td>
				<td>{"255.255.255.224"}</td>
				<td>{"32"}</td>
			</tr>
			<tr>
				<td>{"/26"}</td>
				<td>{"255.255.255.192"}</td>
				<td>{"64"}</td>
			</tr>
			<tr>
				<td>{"/25"}</td>
				<td>{"255.255.255.128"}</td>
				<td>{"128"}</td>
			</tr>
			<tr>
				<td>{"/24"}</td>
				<td>{"255.255.255.0"}</td>
				<td>{"256"}</td>
			</tr>
			<tr>
				<td>{"/23"}</td>
				<td>{"255.255.254.0"}</td>
				<td>{"512"}</td>
			</tr>
			<tr>
				<td>{"/22"}</td>
				<td>{"255.255.252.0"}</td>
				<td>{"1024"}</td>
			</tr>
			<tr>
				<td>{"/21"}</td>
				<td>{"255.255.248.0"}</td>
				<td>{"2048"}</td>
			</tr>
		</tbody>
	</table>
);
