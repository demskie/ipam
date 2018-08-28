import React from "react";
import PropTypes from "prop-types";
import { Tree, Intent, ContextMenu, Menu, MenuItem, Classes } from "@blueprintjs/core";

export class SubnetTree extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			expandedNodeIds: []
		};
	}

	generateLabel = (net, desc) => {
		while (net.length < 24) {
			net += "\u00A0";
		}
		const extraSpace = net + "\u00A0" + desc;
		return (
			<div className="subnetLabel" style={{ fontFamily: "Fira Mono, monospace" }}>
				{extraSpace}
			</div>
		);
	};

	constructTreeNodes = serverData => {
		let processedData = [];
		for (let i in serverData) {
			let newNode = Object.assign({}, serverData[i]);
			newNode.label = this.generateLabel(newNode.net, newNode.desc);
			if (newNode.id === this.props.selectedTreeNode.id) {
				newNode.isSelected = true;
			}
			for (let j in this.state.expandedNodeIds) {
				if (newNode.id === this.state.expandedNodeIds[j]) {
					newNode.isExpanded = true;
				}
			}
			if (newNode.childNodes !== undefined) {
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

	handleNodeClick = nodeData => {
		let newNodeData = Object.assign({}, nodeData);
		newNodeData.isSelected = true;
		newNodeData.isExpanded = true;
		this.props.handleUserAction({ action: "select", nodeData: newNodeData });
		if (nodeData.childNodes !== undefined) {
			let foundMatch = false;
			for (let i in this.state.expandedNodeIds) {
				if (this.state.expandedNodeIds[i] === newNodeData.id) {
					foundMatch = true;
					break;
				}
			}
			if (!foundMatch) {
				this.setState({
					expandedNodeIds: [newNodeData.id, ...this.state.expandedNodeIds]
				});
			}
		}
	};

	handleNodeCollapse = nodeData => {
		nodeData.isExpanded = false;
		let newExpandedNodeIds = [...this.state.expandedNodeIds];
		for (let i in newExpandedNodeIds) {
			if (newExpandedNodeIds[i] === nodeData.id) {
				newExpandedNodeIds.splice(i, 1);
				break;
			}
		}
		this.setState({
			expandedNodeIds: newExpandedNodeIds
		});
	};

	handleNodeExpand = nodeData => {
		nodeData.isExpanded = true;
		this.setState({
			expandedNodeIds: [nodeData.id, ...this.state.expandedNodeIds]
		});
	};

	componentDidMount = () => {
		window.oncontextmenu = ev => {
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
						setTimeout(() => {
							this.props.handleUserAction({
								action: "getScanStart",
								value: this.props.selectedTreeNode.net
							});
							this.props.handleUserAction({
								action: "setSelectedTabId",
								value: "scan"
							});
							this.props.handleUserAction({
								action: "showAdvancedOverlay"
							});
						}, 500);
					},
					intent: Intent.PRIMARY,
					text: "Scan Subnet"
				}),
				React.createElement(MenuItem, {
					className: Classes.DARK,
					onClick: () => {
						this.props.handleUserAction({ action: "triggerSubnetMutationButton", value: "modify" });
					},
					intent: Intent.PRIMARY,
					text: "Modify Subnet"
				}),
				React.createElement(MenuItem, {
					className: Classes.DARK,
					onClick: () => {
						this.props.handleUserAction({ action: "triggerSubnetMutationButton", value: "delete" });
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

SubnetTree.propTypes = {
	handleUserAction: PropTypes.func.isRequired,
	selectedTreeNode: PropTypes.object.isRequired,
	subnetData: PropTypes.array.isRequired
};
