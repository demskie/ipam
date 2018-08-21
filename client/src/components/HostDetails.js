import React from "react";
import PropTypes from "prop-types";
import { Cell, Column, Table, RenderMode } from "@blueprintjs/table";

export class HostDetails extends React.PureComponent {
	columnWidthArrays = () => {
		let width = this.props.hostDetailsWidth / 4;
		return [width, width, width, width];
	};

	addressRenderer = rowIndex => {
		if (rowIndex >= this.props.hostData.addresses.length) {
			return <Cell />;
		}
		let value = this.props.hostData.addresses[rowIndex];
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
		if (rowIndex >= this.props.hostData.aRecords.length) {
			return <Cell />;
		}
		let value = this.props.hostData.aRecords[rowIndex];
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
		if (rowIndex >= this.props.hostData.pingResults.length) {
			return <Cell />;
		}
		let value = this.props.hostData.pingResults[rowIndex];
		if (value === undefined || value === null || value === "") {
			return <Cell />;
		}
		if (parseInt(value, 10) < 0) {
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
		if (rowIndex >= this.props.hostData.lastAttempts.length) {
			return <Cell />;
		}
		let value = this.props.hostData.lastAttempts[rowIndex];
		if (value === undefined || value === null) {
			return <Cell />;
		}
		if (value === "") {
			return (
				<Cell>
					<div style={{ textAlign: "center", color: "rgb(255, 165, 0)" }}>{"pending"}</div>
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
		return (
			<div id="hostDetails" style={{ height: this.props.hostDetailsHeight }}>
				<Table
					className="bp3-dark"
					numRows={this.props.hostData.addresses.length}
					renderMode={RenderMode.NONE}
					enableGhostCells={true}
					columnWidths={this.columnWidthArrays()}
					enableColumnResizing={true}
					enableRowHeader={false}
				>
					<Column name={<div style={{ textAlign: "center" }}>{"Address"}</div>} cellRenderer={this.addressRenderer} />
					<Column name={<div style={{ textAlign: "center" }}>{"A Record"}</div>} cellRenderer={this.aRecordRenderer} />
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
	hostData: PropTypes.object.isRequired,
	hostDetailsWidth: PropTypes.number.isRequired,
	hostDetailsHeight: PropTypes.number.isRequired
};
