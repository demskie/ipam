import React from "react";
import PropTypes from "prop-types";
import { Navbar, NavbarGroup, Alignment, Button } from "@blueprintjs/core";

export class SubnetToolbar extends React.PureComponent {
	render() {
		const sidebarNavbarOffset = () => {
			if (this.props.isSidebarDocked) {
				return "0px";
			}
			return "50px";
		};
		return (
			<Navbar
				id="subnetToolbar"
				className="bp3-dark"
				fixedToTop={true}
				style={{
					top: sidebarNavbarOffset()
				}}
			>
				<NavbarGroup align={Alignment.LEFT}>
					<Button
						className="bp3-minimal"
						icon="add"
						text="Create"
						onClick={() => {
							this.props.handleButtonPress("create");
						}}
					/>
					<Button
						className="bp3-minimal"
						icon="annotation"
						text="Modify"
						disabled={this.props.isSubnetSelected}
						onClick={() => {
							this.props.handleButtonPress("modify");
						}}
					/>
					<Button
						className="bp3-minimal"
						icon="remove"
						text="Delete"
						disabled={this.props.isSubnetSelected}
						onClick={() => {
							this.props.handleButtonPress("delete");
						}}
					/>
				</NavbarGroup>
			</Navbar>
		);
	}
}

SubnetToolbar.propTypes = {
	isSidebarDocked: PropTypes.bool,
	isSubnetSelected: PropTypes.bool,
	handleButtonPress: PropTypes.func
};
