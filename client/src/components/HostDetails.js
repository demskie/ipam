import React from "react";
import PropTypes from "prop-types";
import { Cell, Column, Table, RenderMode } from "@blueprintjs/table";

export class HostDetails extends React.Component {
	constructor() {
		super();
		this.state = {};
	}

	render() {
		const emptyCell = <Cell loading={false} />;
		const columnWidthArrays = () => {
			let width = this.props.tableWidth / 4;
			return [width, width, width, width];
		};
		const numberOfRows = () => {
			const minRows = 128;
			let numRows = minRows;
			if (this.props.details.addresses !== undefined) {
				numRows = this.props.details.addresses.length;
				if (numRows < minRows) {
					numRows = minRows;
				}
			}
			return numRows;
		};
		const addressRenderer = rowIndex => {
			if (rowIndex >= this.props.details.addresses.length) {
				return <Cell />;
			} else if (this.props.details.addresses[rowIndex] === undefined) {
				return emptyCell;
			} else {
				return (
					<Cell>
						<div style={{ textAlign: "center" }}>{this.props.details.addresses[rowIndex]}</div>
					</Cell>
				);
			}
		};
		const aRecordRenderer = rowIndex => {
			if (rowIndex >= this.props.details.aRecords.length) {
				return <Cell />;
			} else if (this.props.details.aRecords[rowIndex] === undefined) {
				return emptyCell;
			} else {
				return (
					<Cell>
						<div style={{ textAlign: "center" }}>{this.props.details.aRecords[rowIndex]}</div>
					</Cell>
				);
			}
		};
		const pingResultRenderer = rowIndex => {
			if (rowIndex >= this.props.details.pingResults.length) {
				return <Cell />;
			} else if (this.props.details.pingResults[rowIndex] === undefined) {
				return emptyCell;
			} else {
				return (
					<Cell>
						<div style={{ textAlign: "center" }}>{this.props.details.pingResults[rowIndex]}</div>
					</Cell>
				);
			}
		};
		const lastAttemptRenderer = rowIndex => {
			if (rowIndex >= this.props.details.lastAttempts.length) {
				return <Cell />;
			} else if (this.props.details.lastAttempts[rowIndex] === undefined) {
				return emptyCell;
			} else {
				return (
					<Cell>
						<div style={{ textAlign: "center" }}>{this.props.details.lastAttempts[rowIndex]}</div>
					</Cell>
				);
			}
		};
		return (
			<div id="hostDetails">
				<Table
					className="bp3-dark"
					numRows={numberOfRows()}
					renderMode={RenderMode.BATCH}
					enableGhostCells={false}
					columnWidths={columnWidthArrays()}
					enableColumnResizing={false}
					enableRowHeader={false}
				>
					<Column
						name={<div style={{ textAlign: "center" }}>{"Address"}</div>}
						cellRenderer={addressRenderer}
					/>
					<Column
						name={<div style={{ textAlign: "center" }}>{"A Record"}</div>}
						cellRenderer={aRecordRenderer}
					/>
					<Column
						name={<div style={{ textAlign: "center" }}>{"Ping Result"}</div>}
						cellRenderer={pingResultRenderer}
					/>
					<Column
						name={<div style={{ textAlign: "center" }}>{"Last Attempt"}</div>}
						cellRenderer={lastAttemptRenderer}
					/>
				</Table>
			</div>
		);
	}
}

HostDetails.propTypes = {
	tableWidth: PropTypes.number,
	details: PropTypes.object
};
