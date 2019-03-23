import React from "react";

import { MainState as SubnetTreeProps } from "../Main";
import { Tree, Intent, ContextMenu, Menu, MenuItem, Classes, ITreeNode } from "@blueprintjs/core";
import { SubnetPromptMode } from "./SubnetPrompt";

var lastClickedNodeID = "foobar";
var lastClickedTime = Date.now();

interface SubnetTreeState {
	expandedNodeIDs: string[];
}

export interface Subnet extends ITreeNode {
	childNodes: Subnet[];
	desc: string;
	id: string;
	modTime: string;
	net: string;
	notes: string;
	vlan: string;
}

export class SubnetTree extends React.Component<SubnetTreeProps, SubnetTreeState> {
	state = {
		expandedNodeIDs: []
	};

	generateLabel = (net: string, desc: string, vlan: string) => {
		while (net.length < 24) {
			net += "\u00A0";
		}
		if (vlan.trim().length > 0) {
			desc += "\u00A0(" + vlan + ")";
		}
		const extraSpace = net + "\u00A0" + desc;
		return (
			<div className="subnetLabel" style={{ fontFamily: "Fira Mono, monospace" }}>
				{extraSpace}
			</div>
		);
	};

	constructTreeNodes = (serverData: Subnet[]) => {
		let processedData = [];
		for (let i in serverData) {
			let newNode = Object.assign({}, serverData[i]);
			newNode.label = this.generateLabel(newNode.net, newNode.desc, newNode.vlan);
			if (newNode.id === this.props.selectedTreeNode.id) {
				newNode.isSelected = true;
			}
			for (let j in this.state.expandedNodeIDs) {
				if (newNode.id === `${this.state.expandedNodeIDs[j]}`) {
					newNode.isExpanded = true;
				}
			}
			if (newNode.childNodes !== undefined || newNode.childNodes !== null) {
				if (newNode.childNodes.length === 0) {
					delete newNode.childNodes;
				} else {
					newNode.childNodes = this.constructTreeNodes(newNode.childNodes);
				}
			}
			processedData.push(newNode);
		}
		return processedData;
	};

	handleNodeClick = (node: ITreeNode) => {
		this.props.triggers.selectTreeNode(node as Subnet);
		if (lastClickedNodeID === node.id && Date.now() - lastClickedTime < 1000) {
			setTimeout(() => {
				this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.SHOW);
			}, 250);
		}
		if (typeof node.id === "string") {
			lastClickedNodeID = node.id;
		} else {
			lastClickedNodeID = `${node.id}`;
		}
		lastClickedTime = Date.now();
		if (node.childNodes !== undefined) {
			let foundMatch = false;
			this.state.expandedNodeIDs.forEach((v, i) => {
				if (v === node.id) {
					foundMatch = true;
				}
			});
			if (!foundMatch) {
				this.setState({
					expandedNodeIDs: [lastClickedNodeID, ...this.state.expandedNodeIDs]
				});
			}
		}
	};

	handleNodeCollapse = (node: ITreeNode) => {
		node.isExpanded = false;
		let newExpandedNodeIDs = [...this.state.expandedNodeIDs];
		if (typeof node.id === "number") {
			node.id = `${node.id}`;
		}
		newExpandedNodeIDs.forEach((v, i) => {
			if (v === node.id) {
				newExpandedNodeIDs.splice(i, 1);
			}
		});
		this.setState({
			expandedNodeIDs: newExpandedNodeIDs
		});
		console.log(newExpandedNodeIDs);
	};

	handleNodeExpand = (node: ITreeNode) => {
		node.isExpanded = true;
		if (typeof node.id === "number") {
			node.id = `${node.id}`;
		}
		this.setState({
			expandedNodeIDs: [node.id, ...this.state.expandedNodeIDs]
		});
		console.log([node.id, ...this.state.expandedNodeIDs]);
	};

	componentDidMount = () => {
		window.oncontextmenu = (ev: any) => {
			console.debug("context menu has opened", ev);
			if (
				ev.target !== undefined &&
				(!ev.target.className.includes("subnetLabel", 0) && !ev.target.className.includes("bp3-tree", 0))
			) {
				return;
			}
			ev.preventDefault();
			const menu = React.createElement(
				Menu,
				{ className: Classes.DARK },
				React.createElement(MenuItem, {
					className: Classes.DARK,
					onClick: () => {
						this.props.triggers.setRootSubnetPromptMode(SubnetPromptMode.SHOW);
					},
					intent: Intent.PRIMARY,
					text: "Show Subnet"
				}),
				React.createElement(MenuItem, {
					className: Classes.DARK,
					onClick: () => {
						setTimeout(() => {
							this.props.triggers.startScan(this.props.selectedTreeNode.net);
							console.log("setSelectedTabId");
							//this.props.handleUserAction({
							//	action: "showAdvancedOverlay"
							//});
							console.log("showAdvancedOverlay");
						}, 500);
					},
					intent: Intent.PRIMARY,
					text: "Scan Subnet"
				}),
				React.createElement(MenuItem, {
					className: Classes.DARK,
					onClick: () => {
						// this.props.handleUserAction({ action: "triggerSubnetPromptAction", value: "modify" });
						console.log("triggerSubnetPromptAction", "modify");
					},
					intent: Intent.PRIMARY,
					text: "Modify Subnet"
				}),
				React.createElement(MenuItem, {
					className: Classes.DARK,
					onClick: () => {
						// this.props.handleUserAction({ action: "triggerSubnetPromptAction", value: "delete" });
						console.log("triggerSubnetPromptAction", "delete");
					},
					intent: Intent.PRIMARY,
					text: "Delete Subnet"
				})
			);
			ContextMenu.show(menu, { left: ev.clientX, top: ev.clientY }, () => {
				console.debug("context menu has closed", ev);
			});
		};
	};

	render() {
		return (
			<Tree
				className="bp3-dark"
				contents={this.constructTreeNodes(this.props.subnetData)}
				onNodeClick={this.handleNodeClick}
				onNodeCollapse={this.handleNodeCollapse}
				onNodeContextMenu={this.handleNodeClick}
				onNodeExpand={this.handleNodeExpand}
			/>
		);
	}
}
