import React from "react";
import PropTypes from "prop-types";
import { Tree, Intent, ContextMenu, Menu, MenuItem, Classes } from "@blueprintjs/core";

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
	console.debug("context menu has opened", ev);
	if (
		selectedSubnet === null ||
		(ev.target !== undefined &&
			(!ev.target.className.includes("subnetLabel", 0) && !ev.target.className.includes("bp3-tree", 0)))
	) {
		return;
	}
	ev.preventDefault();
	const menu = React.createElement(
		Menu,
		{ className: Classes.DARK },
		React.createElement(MenuItem, {
			className: Classes.DARK,
			onClick: triggerCreate,
			intent: Intent.PRIMARY,
			text: "Create New Subnet"
		}),
		React.createElement(MenuItem, {
			className: Classes.DARK,
			onClick: triggerModify,
			intent: Intent.PRIMARY,
			text: "Modify This Subnet"
		}),
		React.createElement(MenuItem, {
			className: Classes.DARK,
			onClick: triggerDelete,
			intent: Intent.PRIMARY,
			text: "Delete This Subnet"
		})
	);
	ContextMenu.show(menu, { left: ev.clientX, top: ev.clientY }, () => {
		console.debug("context menu has closed", ev);
	});
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
		while (net.length < 24) {
			net += "\u00A0";
		}
		return (
			<div className="subnetLabel" style={{ fontFamily: "Fira Mono, monospace" }}>
				{net + "\u00A0" + desc}
			</div>
		);
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
		const processedTree = () => {
			if (window.location.host === "localhost" || window.location.host === "localhost:3000") {
				return this.constructTreeNodes(testTree);
			}
			return this.constructTreeNodes(this.props.subnets);
		};
		return (
			<div id="nestedSubnetsTree">
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
	subnets: PropTypes.array,
	hostDetailsRequester: PropTypes.func,
	handleButtonPress: PropTypes.func
};

var testTree = [];
if (window.location.host === "localhost" || window.location.host === "localhost:3000") {
	let CHANCE = require("chance");
	let chance = new CHANCE();
	let createNode = (z, minMask, maxMask) => {
		let result = {
			id: z,
			net: chance.ip() + "/" + chance.integer({ min: minMask, max: maxMask }),
			desc: chance.street({ syllables: chance.integer({ min: 2, max: 12 }) }),
			childNodes: []
		};
		return result;
	};
	let x = 0;
	for (let i = 0; i < 512; i++) {
		x++;
		testTree.push(createNode(x, 18, 22));
		let children = chance.integer({ min: -12, max: 24 });
		for (let j = 0; j < children; j++) {
			x++;
			testTree[i].childNodes.push(createNode(x, 23, 26));
			let grandchildren = chance.integer({ min: -12, max: 12 });
			for (let k = 0; k < grandchildren; k++) {
				x++;
				testTree[i].childNodes[j].childNodes.push(createNode(x, 27, 32));
			}
		}
	}
}
