import React from "react";
import PropTypes from "prop-types";
import { Tooltip, Tree, Position, Intent } from "@blueprintjs/core";

export class NestedSubnets extends React.PureComponent {
	constructor() {
		super();
		this.state = {
			selectedNode: {},
			expandedNodeIds: {}
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

	constructTreeNodes = (serverData, selectedNode, expandedNodeIds) => {
		let processedData = [];
		for (let i in serverData) {
			let newNode = Object.assign({}, serverData[i]);
			newNode.label = this.generateLabel(newNode.net, newNode.desc);
			if (newNode.id === selectedNode.id) {
				newNode.isSelected = true;
			}
			for (let j in expandedNodeIds) {
				if (newNode.id === expandedNodeIds[j]) {
					newNode.isExpanded = true;
				}
			}
			if (newNode.childNodes !== undefined) {
				if (newNode.childNodes.length === 0) {
					delete newNode.childNodes;
				} else {
					newNode.childNodes = this.constructTreeNodes(newNode.childNodes, selectedNode, expandedNodeIds);
				}
			}
			processedData.push(newNode);
		}
		return processedData;
	};

	handleNodeClick = (nodeData, nodePath, ev) => {
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
			if (window.location.host === "localhost:3000") {
				return this.constructTreeNodes(testTree, this.state.selectedNode, this.state.expandedNodeIds);
			}
			return this.constructTreeNodes(this.props.subnets, this.state.selectedNode, this.state.expandedNodeIds);
		};
		return (
			<Tree
				className="bp3-dark"
				contents={processedTree()}
				onNodeClick={this.handleNodeClick}
				onNodeCollapse={this.handleNodeCollapse}
				onNodeExpand={this.handleNodeExpand}
			/>
		);
	}
}

NestedSubnets.propTypes = {
	subnets: PropTypes.array,
	hostDetailsRequester: PropTypes.func
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
			}
		]
	}
];
