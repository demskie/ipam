import React from "react";
import PropTypes from "prop-types";
import debounce from "debounce";
import { Flex, Box } from "reflexbox";
import { Tooltip, Tree } from "@blueprintjs/core";
import isEqual from "react-fast-compare";

export class NestedSubnets extends React.Component {
	constructor() {
		super();
		this.state = {
			formattedNodes: [],
			selectedNode: {}
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
		let oldSelection = this.state.selectedNode;
		if (nodeData.id !== oldSelection.id) {
			oldSelection.isSelected = false;
		}
		nodeData.isSelected = true;
		nodeData.isExpanded = true;
		this.setState({
			formattedNodes: this.state.formattedNodes,
			selectedNode: nodeData
		});
		this.props.hostDetailsRequester(nodeData.net);
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
			formattedNodes: this.constructTreeNodes(this.props.subnets)
		});
	};

	shouldComponentUpdate = (nextProps, nextState) => {
		if (isEqual(this.props, nextProps) && isEqual(this.state, nextState)) {
			return false;
		}
		return true;
	};

	componentDidUpdate = () => {
		this.setState({
			formattedNodes: this.constructTreeNodes(this.props.subnets)
		});
	};

	render() {
		return (
			<Box auto w={1 / 3} style={{ paddingTop: "10px", paddingRight: "10px", backgroundColor: "#30404D" }}>
				<Tree
					className="bp3-dark"
					contents={this.state.formattedNodes}
					onNodeClick={this.handleNodeClick}
					onNodeCollapse={this.handleNodeCollapse}
					onNodeExpand={this.handleNodeExpand}
				/>
			</Box>
		);
	}
}

NestedSubnets.propTypes = {
	subnets: PropTypes.array,
	hostDetailsRequester: PropTypes.func
};
