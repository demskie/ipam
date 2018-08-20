import React from "react";
import PropTypes from "prop-types";

import { List } from "react-virtualized";

export class TabList extends React.PureComponent {
	render() {
		return (
			<div
				style={{
					width: this.props.panelWidth,
					height: this.props.panelHeight,
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
		);
	}
}

TabList.propTypes = {
	data: PropTypes.array.isRequired,
	panelWidth: PropTypes.number.isRequired,
	panelHeight: PropTypes.number.isRequired
};
