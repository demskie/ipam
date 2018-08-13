import React from "react";
import PropTypes from "prop-types";
import { Tooltip, Tree, Position, Intent } from "@blueprintjs/core";

export class NestedSubnets extends React.Component {
	constructor() {
		super();
		this.state = {
			selectedNode: {},
			expandedContainers: []
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
		for (let i in serverData) {
			serverData[i].label = this.generateLabel(serverData[i].net, serverData[i].desc);
			if (this.state.selectedNode.id === serverData[i].id) {
				serverData[i].isSelected = true;
			}
			for (let j in this.state.expandedContainers) {
				if (this.state.expandedContainers[j].id === serverData[i].id) {
					serverData[i].isExpanded = true;
				}
			}
			if (serverData[i].childNodes !== undefined) {
				if (serverData[i].childNodes.length === 0) {
					delete serverData[i].childNodes;
				} else {
					serverData[i].childNodes = this.constructTreeNodes(serverData[i].childNodes);
				}
			}
		}
		return serverData;
	};

	handleNodeClick = (nodeData, nodePath, ev) => {
		let oldSelection = this.state.selectedNode;
		if (nodeData.id !== oldSelection.id) {
			oldSelection.isSelected = false;
		}
		nodeData.isSelected = true;
		nodeData.isExpanded = true;
		let foundMatch = false;
		let tmpExpandedContainers = this.state.expandedContainers;
		for (let i in tmpExpandedContainers) {
			if (tmpExpandedContainers[i].id === nodeData.id) {
				foundMatch = true;
				break;
			}
		}
		if (!foundMatch) {
			tmpExpandedContainers.push(nodeData);
		}
		this.setState({
			selectedNode: nodeData,
			expandedContainers: tmpExpandedContainers
		});
		this.props.hostDetailsRequester(nodeData.net);
	};

	handleNodeCollapse = nodeData => {
		nodeData.isExpanded = false;
		let tmpExpandedContainers = this.state.expandedContainers;
		for (let i in tmpExpandedContainers) {
			if (tmpExpandedContainers[i].id === nodeData.id) {
				tmpExpandedContainers.splice(i, 1);
			}
		}
		this.setState({
			expandedContainers: tmpExpandedContainers
		});
	};

	handleNodeExpand = nodeData => {
		nodeData.isExpanded = true;
		let foundMatch = false;
		let tmpExpandedContainers = this.state.expandedContainers;
		for (let i in tmpExpandedContainers) {
			if (tmpExpandedContainers[i].id === nodeData.id) {
				foundMatch = true;
				break;
			}
		}
		if (!foundMatch) {
			tmpExpandedContainers.push(nodeData);
			this.setState({
				expandedContainers: tmpExpandedContainers
			});
		}
	};

	render() {
		const buildTree = () => {
			if (this.props.subnets.length === 0) {
				return this.constructTreeNodes(emptyLoadingTree);
			}
			return this.constructTreeNodes(this.props.subnets);
		};
		return (
			<Tree
				className="bp3-dark"
				contents={buildTree()}
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

const emptyLoadingTree = [
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
