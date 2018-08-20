import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Button, Intent, Label, TextArea, InputGroup, Tooltip, Position } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import classNames from "classnames";

export class SubnetPrompt extends React.PureComponent {
	render() {
		const create = (
			<Dialog
				className={classNames(Classes.DARK)}
				title=""
				isOpen={this.props.isOpen}
				onClose={() => {
					this.props.sendUserAction({ action: "closeNestedSubnetsPrompt" });
				}}
			>
				<div className={classNames(Classes.DIALOG_BODY)}>
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
				<div className={classNames(Classes.DIALOG_FOOTER_ACTIONS)}>
					<Button
						intent={Intent.SUCCESS}
						onClick={() => {
							this.props.sendUserAction({
								action: "create",
								subnet: document.getElementById("cidr-input").value,
								description: document.getElementById("description-input").value,
								vlan: document.getElementById("vlan-input").value,
								notes: document.getElementById("notes-input").value
							});
						}}
						style={{ marginRight: "40px", marginBottom: "10px" }}
					>
						Create Subnet
					</Button>
				</div>
			</Dialog>
		);
		const modify = (
			<Dialog
				className={classNames(Classes.DARK)}
				title=""
				isOpen={this.props.isOpen}
				onClose={() => {
					this.props.sendUserAction({ action: "closeNestedSubnetsPrompt" });
				}}
			>
				<div className={classNames(Classes.DIALOG_BODY)}>
					<Flex justify="center">
						<Box p={2}>
							<Label>
								Subnet CIDR
								<InputGroup
									id="cidr-input"
									placeholder=""
									value={this.props.subnetInfo.net}
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
									defaultValue={this.props.subnetInfo.desc}
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
									defaultValue={this.props.subnetInfo.vlan}
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
									defaultValue={this.props.subnetInfo.notes}
									onChange={ev => {
										document.getElementById("notes-input").value = ev.target.value;
									}}
								/>
							</Label>
						</Box>
					</Flex>
				</div>
				<div className={classNames(Classes.DIALOG_FOOTER_ACTIONS)}>
					<Button
						intent={Intent.WARNING}
						onClick={() => {
							this.props.sendUserAction({
								action: "modify",
								subnet: document.getElementById("cidr-input").value,
								description: document.getElementById("description-input").value,
								vlan: document.getElementById("vlan-input").value,
								notes: document.getElementById("notes-input").value
							});
						}}
						style={{ marginRight: "40px", marginBottom: "10px" }}
					>
						Modify Subnet
					</Button>
				</div>
			</Dialog>
		);
		const remove = (
			<Dialog
				className={classNames(Classes.DARK)}
				title=""
				isOpen={this.props.isOpen}
				onClose={() => {
					this.props.sendUserAction({ action: "closeNestedSubnetsPrompt" });
				}}
			>
				<div className={classNames(Classes.DIALOG_BODY)}>
					<Flex justify="center">
						<Box p={2}>
							<Label>
								Subnet CIDR
								<InputGroup
									id="cidr-input"
									placeholder=""
									value={this.props.subnetInfo.net}
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
								<InputGroup id="description-input" placeholder="" value={this.props.subnetInfo.desc} disabled={true} />
							</Label>
							<Label>
								VLAN ID
								<InputGroup id="vlan-input" placeholder="" value={this.props.subnetInfo.vlan} disabled={true} />
							</Label>
						</Box>
						<Box p={2}>
							<Label>
								Scratch Notes
								<TextArea
									id="notes-input"
									large={false}
									style={{ width: "210px", maxWidth: "210px", height: "165px" }}
									value={this.props.subnetInfo.notes}
									disabled={true}
								/>
							</Label>
						</Box>
					</Flex>
				</div>
				<div className={classNames(Classes.DIALOG_FOOTER_ACTIONS)}>
					<Button
						intent={Intent.DANGER}
						onClick={() => {
							this.props.sendUserAction({
								action: "delete",
								subnet: document.getElementById("cidr-input").value
							});
						}}
						style={{ marginRight: "40px", marginBottom: "10px" }}
					>
						Delete Subnet
					</Button>
				</div>
			</Dialog>
		);
		switch (this.props.subnetAction) {
			case "create":
				return create;
			case "modify":
				return modify;
			case "delete":
				return remove;
			default:
				return null;
		}
	}
}

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

SubnetPrompt.propTypes = {
	subnetAction: PropTypes.string,
	subnetInfo: PropTypes.object,
	isOpen: PropTypes.bool,
	sendUserAction: PropTypes.func
};
