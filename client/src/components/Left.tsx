import React from "react";

import { MainState } from "./Main";
import { SubnetPrompt } from "./left/SubnetPrompt";
import { SubnetToolbar } from "./left/SubnetToolbar";
import { SubnetTree } from "./left/SubnetTree";

export class Left extends React.Component<MainState, {}> {
	render() {
		return (
			<React.Fragment>
				<div id="sidebarSpacing" style={{ height: this.props.sidebarDocked ? "0px" : "50px" }} />
				<div id="sidebarElements" style={{ width: "100%", height: "100%" }}>
					<SubnetPrompt {...this.props} />
					<SubnetToolbar {...this.props} />
					<SubnetTree {...this.props} />
				</div>
			</React.Fragment>
		);
	}
}
