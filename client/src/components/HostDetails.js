import React from "react";
import PropTypes from "prop-types";
import { Cell, Column, Table, RenderMode } from "@blueprintjs/table";

export class HostDetails extends React.PureComponent {
	constructor() {
		super();
		this.state = {};
	}

	columnWidthArrays = () => {
		let width = this.props.tableWidth / 4;
		return [width, width, width, width];
	};

	addressRenderer = rowIndex => {
		if (rowIndex >= this.props.details.addresses.length) {
			return <Cell />;
		}
		let value = this.props.details.addresses[rowIndex];
		if (value === undefined || value === null) {
			return <Cell />;
		}
		return (
			<Cell>
				<div style={{ textAlign: "center" }}>{value}</div>
			</Cell>
		);
	};

	aRecordRenderer = rowIndex => {
		if (rowIndex >= this.props.details.aRecords.length) {
			return <Cell />;
		}
		let value = this.props.details.aRecords[rowIndex];
		if (value === undefined || value === null) {
			return <Cell />;
		}
		return (
			<Cell>
				<div style={{ textAlign: "center" }}>{value}</div>
			</Cell>
		);
	};

	pingResultRenderer = rowIndex => {
		if (rowIndex >= this.props.details.pingResults.length) {
			return <Cell />;
		}
		let value = this.props.details.pingResults[rowIndex];
		if (value === undefined || value === null) {
			return <Cell />;
		}
		if (value === "failure") {
			return (
				<Cell>
					<div style={{ textAlign: "center", color: "rgb(255, 0, 0)" }}>{"unreachable"}</div>
				</Cell>
			);
		}
		return (
			<Cell>
				<div style={{ textAlign: "center", color: "rgb(0, 240, 0)" }}>{value}</div>
			</Cell>
		);
	};

	lastAttemptRenderer = rowIndex => {
		if (rowIndex >= this.props.details.lastAttempts.length) {
			return <Cell />;
		}
		let value = this.props.details.lastAttempts[rowIndex];
		if (value === undefined || value === null) {
			return <Cell />;
		}
		if (value === "") {
			return (
				<Cell>
					<div style={{ textAlign: "center", color: "orange" }}>{"pending"}</div>
				</Cell>
			);
		}
		return (
			<Cell>
				<div style={{ textAlign: "center" }}>{value}</div>
			</Cell>
		);
	};

	render() {
		const getTableHeight = () => {
			return window.document.body.clientHeight - 50 + "px";
		};
		return (
			<div id="hostDetails" style={{ height: getTableHeight() }}>
				<Table
					className="bp3-dark"
					numRows={this.props.details.addresses.length}
					renderMode={RenderMode.BATCH}
					enableGhostCells={true}
					columnWidths={this.columnWidthArrays()}
					enableColumnResizing={true}
					enableRowHeader={false}
				>
					<Column
						name={<div style={{ textAlign: "center" }}>{"Address"}</div>}
						cellRenderer={this.addressRenderer}
					/>
					<Column
						name={<div style={{ textAlign: "center" }}>{"A Record"}</div>}
						cellRenderer={this.aRecordRenderer}
					/>
					<Column
						name={<div style={{ textAlign: "center" }}>{"Ping Result"}</div>}
						cellRenderer={this.pingResultRenderer}
					/>
					<Column
						name={<div style={{ textAlign: "center" }}>{"Last Attempt"}</div>}
						cellRenderer={this.lastAttemptRenderer}
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
