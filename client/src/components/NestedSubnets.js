import React from "react";
import debounce from "debounce";
import { Flex, Box } from "reflexbox";
import { Tooltip, Tree } from "@blueprintjs/core";

export class NestedSubnets extends React.Component {
	constructor() {
		super();
		this.state = {
			rootTreeNodes: [],
			selectedNodes: []
		};
	}

	generateLabel = (net, desc) => {
		while (net.length < 20) {
			net += " ";
		}
		return net + " " + desc;
	};

	constructTreeNodes = serverData => {
		for (let i in serverData) {
			serverData[i].label = this.generateLabel(serverData[i].net, serverData[i].desc);
			if (serverData[i].childNodes !== undefined) {
				serverData[i].childNodes = this.constructTreeNodes(serverData[i].childNodes);
			}
		}
		return serverData;
	};

	handleNodeClick = (nodeData, nodePath, ev) => {
		let newSelections = [];
		let oldSelections = this.state.selectedNodes;
		for (let i in oldSelections) {
			if (oldSelections[i].id === nodeData.id) {
				continue;
			}
			if (!ev.shiftKey) {
				oldSelections[i].isSelected = false;
			}
		}
		nodeData.isSelected = true;
		nodeData.isExpanded = true;
		newSelections.push(nodeData);
		this.setState({
			rootTreeNodes: this.state.rootTreeNodes,
			selectedNodes: newSelections
		});
	};

	handleNodeCollapse = nodeData => {
		nodeData.isExpanded = false;
		this.setState(this.state);
	};

	handleNodeExpand = nodeData => {
		nodeData.isExpanded = true;
		this.setState(this.state);
	};

	componentDidMount = () => {
		this.setState({
			rootTreeNodes: this.constructTreeNodes(mockServerData)
		});
	};

	render() {
		return (
			<Box auto w={1 / 3} style={{ paddingTop: "10px", paddingRight: "10px", backgroundColor: "#30404D" }}>
				<Tree
					className="bp3-dark"
					contents={this.state.rootTreeNodes}
					onNodeClick={this.handleNodeClick}
					onNodeCollapse={this.handleNodeCollapse}
					onNodeExpand={this.handleNodeExpand}
				/>
			</Box>
		);
	}
}

const mockServerData = [
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
