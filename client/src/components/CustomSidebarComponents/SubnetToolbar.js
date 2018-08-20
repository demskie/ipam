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
						icon="add"
						text="Create"
						onClick={() => {
							this.props.handleUserAction({ action: "create" });
						}}
					/>
					<Button
						className="bp3-minimal"
						icon="annotation"
						text="Modify"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => {
							this.props.handleUserAction({ action: "modify" });
						}}
					/>
					<Button
						className="bp3-minimal"
						icon="remove"
						text="Delete"
						disabled={Object.keys(this.props.selectedTreeNode).length === 0}
						onClick={() => {
							this.props.handleUserAction({ action: "delete" });
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
