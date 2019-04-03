import React from "react";

import { List } from "react-virtualized";

interface TabListProps {
	darkMode: boolean;
	data: Array<any>;
	panelHeight: number;
	panelWidth: number;
}

interface TabListState {}

export class TabList extends React.PureComponent<TabListProps, TabListState> {
	render() {
		return (
			<div
				className={
					this.props.darkMode ? "dark-mode-background-color-first color-white" : "light-mode-background-color-third"
				}
				style={{
					width: this.props.panelWidth,
					height: this.props.panelHeight,
					borderRadius: "9px",
					paddingLeft: "10px"
				}}
			>
				<List
					height={this.props.panelHeight}
					rowCount={this.props.data.length}
					rowHeight={30}
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
