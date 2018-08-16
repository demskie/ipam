import React from "react";
import PropTypes from "prop-types";
import { Tooltip, Tree, Position, Intent, ContextMenu, Menu, MenuItem } from "@blueprintjs/core";

var selectedSubnet = null;

var triggerCreate = function() {
	console.log("create was clicked before component mount");
};
var triggerModify = function() {
	console.log("modify was clicked before component mount");
};
var triggerDelete = function() {
	console.log("delete was clicked before component mount");
};

window.oncontextmenu = ev => {
	if (selectedSubnet !== null && ev.path[0].className.includes("bp3-tree", 0)) {
		console.debug("context menu has opened");
		ev.preventDefault();
		const menu = React.createElement(
			Menu,
			{ className: "bp3-dark" }, // props
			React.createElement(MenuItem, { className: "bp3-dark", onClick: triggerCreate, text: "Create" }),
			React.createElement(MenuItem, { className: "bp3-dark", onClick: triggerModify, text: "Modify" }),
			React.createElement(MenuItem, { className: "bp3-dark", onClick: triggerDelete, text: "Delete" })
		);
		ContextMenu.show(menu, { left: ev.clientX, top: ev.clientY }, () => {
			console.debug("context menu has closed");
		});
	}
};

export class NestedSubnets extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			selectedNode: {},
			expandedNodeIds: {}
		};
		triggerCreate = () => {
			console.log("create");
			props.handleButtonPress("create");
		};
		triggerModify = () => {
			props.handleButtonPress("modify");
		};
		triggerDelete = () => {
			props.handleButtonPress("delete");
		};
	}

	generateLabel = (net, desc) => {
		let tooltipContent = net + "  " + desc;
		while (net.length < 24) {
			net += " ";
		}
		if (tooltipContent.length > 40) {
			return (
				<Tooltip
					content={tooltipContent}
					position={Position.TOP_RIGHT}
					intent={Intent.NONE}
					hoverOpenDelay={500}
				>
					{net + " " + desc}
				</Tooltip>
			);
		}
		return net + " " + desc;
	};

	constructTreeNodes = serverData => {
		let processedData = [];
		for (let i in serverData) {
			let newNode = Object.assign({}, serverData[i]);
			newNode.label = this.generateLabel(newNode.net, newNode.desc);
			if (newNode.id === this.state.selectedNode.id) {
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
		if (nodeData.childNodes !== undefined) {
			let foundMatch = false;
			for (let i in this.state.expandedNodeIds) {
				if (this.state.expandedNodeIds[i] === newNodeData.id) {
					foundMatch = true;
					this.setState({
						selectedNode: newNodeData
					});
					break;
				}
			}
			if (!foundMatch) {
				this.setState({
					selectedNode: newNodeData,
					expandedNodeIds: [newNodeData.id, ...this.state.expandedNodeIds]
				});
			}
		} else {
			this.setState({
				selectedNode: newNodeData
			});
		}
		this.props.hostDetailsRequester(newNodeData);
	};

	handleNodeContextClick = nodeData => {
		selectedSubnet = nodeData;
		this.handleNodeClick(nodeData);
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

	render() {
		const getPadding = () => {
			if (this.props.isSidebarDocked) {
				return "60px";
			}
			return "100px";
		};
		const processedTree = () => {
			if (window.location.host === "localhost:3000") {
				return this.constructTreeNodes(testTree);
			}
			return this.constructTreeNodes(this.props.subnets);
		};
		return (
			<div style={{ paddingTop: getPadding() }}>
				<Tree
					className="bp3-dark"
					contents={processedTree()}
					onNodeClick={this.handleNodeClick}
					onNodeCollapse={this.handleNodeCollapse}
					onNodeContextMenu={this.handleNodeContextClick}
					onNodeExpand={this.handleNodeExpand}
				/>
			</div>
		);
	}
}

NestedSubnets.propTypes = {
	isSidebarDocked: PropTypes.bool,
	subnets: PropTypes.array,
	hostDetailsRequester: PropTypes.func,
	handleButtonPress: PropTypes.func
};

const testTree = [
	{
		id: 0,
		net: "255.255.255.255/18",
		desc: "alpha"
	},
	{
		id: 1,
		net: "255.255.255.255/18",
		desc: "bravo",
		childNodes: [
			{
				id: 2,
				net: "255.255.255.255/18",
				desc: "charlie"
			},
			{
				id: 3,
				net: "255.255.255.255/18",
				desc: "delta"
			},
			{
				id: 4,
				net: "255.255.255.255/18",
				desc: "echo"
			},
			{
				id: 5,
				net: "255.255.255.255/18",
				desc: "foxtrot"
			},
			{
				id: 6,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 7,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 8,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 9,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 10,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 11,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 12,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 13,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 14,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 15,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 16,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 17,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 18,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 19,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 20,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 21,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 22,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 23,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 24,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 25,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 26,
				net: "255.255.255.255/18",
				desc: "golf"
			},
			{
				id: 27,
				net: "255.255.255.255/18",
				desc: "golf"
			}
		]
	}
];
