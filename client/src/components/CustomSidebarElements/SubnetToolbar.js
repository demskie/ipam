import React from "react";
import PropTypes from "prop-types";
import { Navbar, NavbarGroup, Alignment, Button } from "@blueprintjs/core";

export class SubnetToolbar extends React.PureComponent {
	sidebarNavbarOffset = () => {
		if (this.props.sidebarDocked) {
			return "0px";
		}
		return "50px";
	};
	render() {
		return (
			<Navbar
				id="subnetToolbar"
				className="bp3-dark"
				fixedToTop={true}
				style={{
					top: this.sidebarNavbarOffset()
				}}
			>
				<NavbarGroup align={Alignment.LEFT}>
					<Button
						className="bp3-minimal"
						icon="geosearch"
						text="Scan"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => {
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
						}}
					/>
					<Button
						className="bp3-minimal"
						icon="add"
						text="Create"
						onClick={() => {
							this.props.handleUserAction({ action: "triggerSubnetMutationButton", value: "create" });
						}}
					/>
					<Button
						className="bp3-minimal"
						icon="annotation"
						text="Modify"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => {
							this.props.handleUserAction({ action: "triggerSubnetMutationButton", value: "modify" });
						}}
					/>
					<Button
						className="bp3-minimal"
						icon="remove"
						text="Delete"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => {
							this.props.handleUserAction({ action: "triggerSubnetMutationButton", value: "delete" });
						}}
					/>
				</NavbarGroup>
			</Navbar>
		);
	}
}

SubnetToolbar.propTypes = {
	handleUserAction: PropTypes.func.isRequired,
	selectedTreeNode: PropTypes.object.isRequired,
	sidebarDocked: PropTypes.bool.isRequired
};
