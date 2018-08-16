import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Button, Intent, Label, TextArea, InputGroup, Tooltip, Position } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import classNames from "classnames";

export class AdvancedOverlay extends React.Component {
	constructor() {
		super();
	}

	componentDidMount = () => {};

	render() {
		return (
			<Flex justify="center">
				<Box p={2}>
					<Dialog
						className={classNames(Classes.DARK)}
						style={{ width: "80vw", minHeight: "80vh" }}
						isOpen={this.props.isOpen}
						onClose={() => {
							this.props.sendUserAction({ action: "closeAdvancedOverlay" });
						}}
					>
						<h1 style={{ textAlign: "center" }}>{"TESTING TESTING 123"}</h1>
					</Dialog>
				</Box>
			</Flex>
		);
	}
}

AdvancedOverlay.propTypes = {
	historyData: PropTypes.array,
	isOpen: PropTypes.bool,
	sendUserAction: PropTypes.func
};
