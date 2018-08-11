import React from "react";
import PropTypes from "prop-types";
import debounce from "debounce";
import { Flex, Box } from "reflexbox";
import { Cell, Column, Table, RenderMode, SelectionModes } from "@blueprintjs/table";
import { HeaderCell } from "@blueprintjs/table/lib/esm/headers/headerCell";

export class HostDetails extends React.Component {
	constructor() {
		super();
		this.state = {
			columnWidthArrays: null
		};
	}

	updateColumnWidthArrays = () => {
		let width = (document.getElementById("root").clientWidth * (2 / 3)) / 4;
		this.setState({
			columnWidthArrays: [width, width, width, width]
		});
	};

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateColumnWidthArrays, 1000));
		this.updateColumnWidthArrays();
	};

	render() {
		const addressRenderer = rowIndex => {
			if (rowIndex >= this.props.details.addresses.length) {
				return <Cell />;
			} else if (this.props.details.addresses[rowIndex] === undefined) {
				return <Cell loading={true} />;
			} else {
				return <Cell>{this.props.details.addresses[rowIndex]}</Cell>;
			}
		};
		const aRecordRenderer = rowIndex => {
			if (rowIndex >= this.props.details.aRecords.length) {
				return <Cell />;
			} else if (this.props.details.aRecords[rowIndex] === undefined) {
				return <Cell loading={true} />;
			} else {
				return <Cell>{this.props.details.aRecords[rowIndex]}</Cell>;
			}
		};
		const pingResultRenderer = rowIndex => {
			if (rowIndex >= this.props.details.pingResults.length) {
				return <Cell />;
			} else if (this.props.details.pingResults[rowIndex] === undefined) {
				return <Cell loading={true} />;
			} else {
				return <Cell>{this.props.details.pingResults[rowIndex]}</Cell>;
			}
		};
		const lastAttemptRenderer = rowIndex => {
			if (rowIndex >= this.props.details.lastAttempts.length) {
				return <Cell />;
			} else if (this.props.details.lastAttempts[rowIndex] === undefined) {
				return <Cell loading={true} />;
			} else {
				return <Cell>{this.props.details.lastAttempts[rowIndex]}</Cell>;
			}
		};
		return (
			<Box auto w={2 / 3}>
				<Table
					className="bp3-dark"
					numRows={1024}
					renderMode={RenderMode.BATCH_ON_UPDATE}
					enableGhostCells={true}
					columnWidths={this.state.columnWidthArrays}
					enableRowHeader={true}
					rowHeaderCellRenderer={() => {
						return <HeaderCell />;
					}}
				>
					<Column name="Address" cellRenderer={addressRenderer} />
					<Column name="A Record" cellRenderer={aRecordRenderer} />
					<Column name="Ping Result" cellRenderer={pingResultRenderer} />
					<Column name="Last Attempt" cellRenderer={lastAttemptRenderer} />
				</Table>
			</Box>
		);
	}
}

HostDetails.propTypes = {
	details: PropTypes.object
};
