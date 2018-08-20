import React from "react";
import PropTypes from "prop-types";

import { Tab } from "@blueprintjs/core";
import { List } from "react-virtualized";

export class TabList extends React.PureComponent {
	render() {
		return (
			<Tab
				id={this.props.id}
				title={this.props.title}
				panel={
					<div
						style={{
							width: this.props.panelWidth + "px",
							height: this.props.panelHeight + "px",
							backgroundColor: "#232d35",
							borderRadius: "9px",
							paddingLeft: "10px"
						}}
					>
						<List
							height={this.props.panelHeight}
							rowCount={this.props.data.length}
							rowHeight={26}
							rowRenderer={obj => {
								return (
									<div className="virtualRow" key={obj.key} style={obj.style}>
										{this.props.data[obj.index]}
									</div>
								);
							}}
							width={this.props.panelWidth - 15}
						/>
					</div>
				}
			/>
		);
	}
}

TabList.propTypes = {
	id: PropTypes.string,
	title: PropTypes.string,
	panelWidth: PropTypes.number,
	panelHeight: PropTypes.number,
	data: PropTypes.array
};
