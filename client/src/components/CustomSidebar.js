import React from "react";
import PropTypes from "prop-types";

import Sidebar from "react-sidebar";
import { SubnetToolbar } from "./SidebarComponents/SubnetToolbar.js";
import { SubnetTree } from "./SidebarComponents/SubnetTree.js";
import { SubnetPrompt } from "./SidebarComponents/SubnetPrompt.js";

export class CustomSidebar extends React.Component {
	constructor() {
		super();
		this.state = {};
	}
	getSidebarHeightOffset = () => {
		if (this.props.sidebarDocked) {
			return "0px";
		}
		return "50px";
	};
	render() {
		return (
			<Sidebar
				open={this.props.sidebarOpen}
				docked={this.props.sidebarDocked}
				onSetOpen={open => {
					this.setState({ sidebarOpen: open });
				}}
				styles={{
					sidebar: {
						width: this.props.sidebarWidth + "px",
						backgroundColor: "#30404D"
					}
				}}
				sidebar={
					<div id="sidebarElements" style={{ position: "relative", top: this.getSidebarHeightOffset() }}>
						<SubnetToolbar isSidebarDocked={this.props.sidebarDocked} handleUserAction={this.props.handleUserAction} />
						<SubnetTree
							subnets={this.props.subnetData}
							hostDetailsRequester={nodeData => {
								this.setState({
									selectedSubnetInfo: nodeData
								});
								this.requestHostData(nodeData.net);
							}}
							handleUserAction={this.props.handleUserAction}
						/>
						<SubnetPrompt
							subnetAction={this.state.nestedSubnetPromptAction}
							subnetInfo={this.state.selectedSubnetInfo}
							isOpen={this.state.nestedSubnetPromptEnabled}
							sendUserAction={this.props.handleUserAction}
						/>
					</div>
				}
			>
				{this.props.content}
			</Sidebar>
		);
	}
}

CustomSidebar.propTypes = {
	subnetData: PropTypes.array.isRequired,
	sidebarOpen: PropTypes.bool.isRequired,
	sidebarDocked: PropTypes.bool.isRequired,
	sidebarWidth: PropTypes.number.isRequired,
	handleUserAction: PropTypes.func.isRequired,
	content: PropTypes.node.isRequired
};
