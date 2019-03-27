import React from "react";

import { SubnetPromptMode } from "../SubnetPrompt";
import { Subnet } from "../SubnetTree";

import { Button, Intent, Label, TextArea, InputGroup, Tooltip, Position } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import * as ipaddr from "ipaddr.js";

interface SubnetInputGroupsProps {
	subnetPromptMode: SubnetPromptMode;
	selectedTreeNode: Subnet;
}

interface SubnetInputGroupsState {
	isValidCIDR: boolean;
}

export class SubnetInputGroups extends React.Component<SubnetInputGroupsProps, SubnetInputGroupsState> {
	state = {
		isValidCIDR: true
	};

	render() {
		const isShow = this.props.subnetPromptMode === SubnetPromptMode.SHOW;
		const isCreate = this.props.subnetPromptMode === SubnetPromptMode.CREATE;
		const isModify = this.props.subnetPromptMode === SubnetPromptMode.MODIFY;
		const isDelete = this.props.subnetPromptMode === SubnetPromptMode.DELETE;
		const getPrefix = () => {
			switch (true) {
				case isShow:
					return "show";
				case isCreate:
					return "create";
				case isModify:
					return "modify";
				case isDelete:
					return "delete";
			}
			return "unknown";
		};
		return (
			<Flex justify="center">
				<Box p={2}>
					<Label>
						{"Subnet CIDR"}
						<InputGroup
							id={`${getPrefix()}-cidr-input`}
							placeholder={"127.0.0.0/8"}
							defaultValue={isCreate ? "" : this.props.selectedTreeNode.net}
							disabled={isShow || isDelete}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								if (event.target.value !== "") {
									try {
										ipaddr.parseCIDR(event.target.value);
									} catch {
										return this.setState({ isValidCIDR: false });
									}
								}
								this.setState({ isValidCIDR: true });
							}}
							intent={this.state.isValidCIDR ? Intent.NONE : Intent.DANGER}
							rightElement={
								<Tooltip
									className="bp3-dark"
									content={subnettingHint}
									intent={Intent.NONE}
									boundary={"viewport"}
									position={Position.RIGHT}
								>
									<Button className="bp3-minimal" icon="help" />
								</Tooltip>
							}
						/>
					</Label>
					<Tooltip
						className="bp3-dark"
						content={this.props.selectedTreeNode.desc}
						position={Position.RIGHT}
						intent={Intent.NONE}
						disabled={isCreate}
					>
						<Label>
							{"Description"}
							<InputGroup
								id={`${getPrefix()}-description-input`}
								placeholder={"mcsubnettyface"}
								defaultValue={(() => {
									return isCreate ? "" : this.props.selectedTreeNode.desc;
								})()}
								disabled={isShow || isDelete}
								style={{ width: "186px" }}
							/>
						</Label>
					</Tooltip>
					<Label>
						{"VLAN ID"}
						<InputGroup
							id={`${getPrefix()}-vlan-input`}
							defaultValue={(() => {
								return isCreate ? "" : this.props.selectedTreeNode.vlan;
							})()}
							disabled={isShow || isDelete}
						/>
					</Label>
				</Box>
				<Box p={2}>
					<Label>
						{"Scratch Notes"}
						<TextArea
							id={`${getPrefix()}-notes-input`}
							large={false}
							style={{ width: "210px", maxWidth: "210px", height: "165px" }}
							defaultValue={(() => {
								return isCreate ? "" : this.props.selectedTreeNode.notes;
							})()}
							disabled={isShow || isDelete}
						/>
					</Label>
				</Box>
			</Flex>
		);
	}
}

const subnettingHint = (
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
