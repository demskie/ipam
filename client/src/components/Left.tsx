import React from "react";

import { MainState } from "./Main";
import { SubnetPrompt } from "./left/SubnetPrompt";
import { SubnetToolbar } from "./left/SubnetToolbar";
import { SubnetTree } from "./left/SubnetTree";

export class Left extends React.Component<MainState, {}> {
	render() {
		return (
			<div className="sidebarElements" style={{ top: this.props.sidebarDocked ? "0px" : "50px" }}>
				<SubnetPrompt {...this.props} />
				<SubnetToolbar {...this.props} />
				<SubnetTree {...this.props} />
			</div>
		);
	}
}
