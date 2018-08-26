import React from "react";
import PropTypes from "prop-types";

import Sidebar from "react-sidebar";
import { SubnetToolbar } from "./CustomSidebarElements/SubnetToolbar.js";
import { SubnetTree } from "./CustomSidebarElements/SubnetTree.js";
import { SubnetPrompt } from "./CustomSidebarElements/SubnetPrompt.js";

export class CustomSidebar extends React.PureComponent {
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
					this.props.handleUserAction({ action: "setSidebarOpen", value: open });
				}}
				styles={{
					sidebar: {
						width: this.props.sidebarWidth + "px",
						backgroundColor: "#30404D"
					}
				}}
				sidebar={
					<div id="sidebarElements" style={{ position: "relative", top: this.getSidebarHeightOffset() }}>
						<SubnetToolbar
							handleUserAction={this.props.handleUserAction}
							selectedTreeNode={this.props.selectedTreeNode}
							sidebarDocked={this.props.sidebarDocked}
						/>
						<SubnetTree
							handleUserAction={this.props.handleUserAction}
							selectedTreeNode={this.props.selectedTreeNode}
							subnetData={this.props.subnetData}
						/>
						<SubnetPrompt
							handleUserAction={this.props.handleUserAction}
							selectedTreeNode={this.props.selectedTreeNode}
							subnetPromptAction={this.props.subnetPromptAction}
							subnetPromptEnabled={this.props.subnetPromptEnabled}
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
	content: PropTypes.node.isRequired,
	handleUserAction: PropTypes.func.isRequired,
	selectedTreeNode: PropTypes.object.isRequired,
	sidebarOpen: PropTypes.bool.isRequired,
	sidebarDocked: PropTypes.bool.isRequired,
	sidebarWidth: PropTypes.number.isRequired,
	subnetData: PropTypes.array.isRequired,
	subnetPromptAction: PropTypes.string.isRequired,
	subnetPromptEnabled: PropTypes.bool.isRequired
};
