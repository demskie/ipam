import React from "react";
import PropTypes from "prop-types";
import { Cell, Column, Table, RenderMode } from "@blueprintjs/table";

const addressWidth = 150;
const aRecordWidth = 260;
const pingResultWidth = 120;
const lastAttemptWidth = 160;
const extraDataWidth = 160;

export class HostDetails extends React.PureComponent {
	getRowCount = () => {
		if (this.props.hostData[0] !== undefined) {
			return this.props.hostData[0].length;
		}
		return 0;
	};

	columnWidthArray = () => {
		if (this.props.hostData.length <= 4) {
			const width = this.props.hostDetailsWidth / 4;
			return [width, width, width, width];
		}
		let widthArray = [addressWidth, aRecordWidth, pingResultWidth, lastAttemptWidth];
		for (let i = 4; i < this.props.hostData.length; i++) {
			widthArray.push(extraDataWidth);
		}
		return widthArray;
	};

	numberOfFrozenCells = () => {
		if (this.props.hostData[4] === undefined) {
			return 0;
		}
		return 2;
	};

	addressRenderer = rowIndex => {
		if (this.props.hostData.length < 1 || rowIndex >= this.props.hostData[0].length) {
			return <Cell />;
		}
		let value = this.props.hostData[0][rowIndex];
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
		if (this.props.hostData.length < 2 || rowIndex >= this.props.hostData[1].length) {
			return <Cell />;
		}
		let value = this.props.hostData[1][rowIndex];
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
		if (this.props.hostData.length < 3 || rowIndex >= this.props.hostData[2].length) {
			return <Cell />;
		}
		let value = this.props.hostData[2][rowIndex];
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
		if (this.props.hostData.length < 4 || rowIndex >= this.props.hostData[3].length) {
			return <Cell />;
		}
		let value = this.props.hostData[3][rowIndex];
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

	extraColumns = () => {
		let arrayOfColumns = [];
		for (let i = 4; i < this.props.hostData.length; i++) {
			arrayOfColumns.push(
				<Column
					name={<div style={{ textAlign: "center" }}>{this.props.hostData[i][0]}</div>}
					cellRenderer={rowIndex => {
						if (rowIndex >= this.props.hostData[i].length + 1) {
							return <Cell />;
						}
						return (
							<Cell>
								<div style={{ textAlign: "center" }}>{this.props.hostData[i][rowIndex + 1]}</div>
							</Cell>
						);
					}}
				/>
			);
		}
		return arrayOfColumns;
	};

	render() {
		return (
			<div id="hostDetails" style={{ height: this.props.hostDetailsHeight }}>
				<Table
					className="bp3-dark"
					numRows={this.getRowCount()}
					renderMode={RenderMode.NONE}
					enableGhostCells={true}
					columnWidths={this.columnWidthArray()}
					enableColumnResizing={true}
					enableRowHeader={false}
					numFrozenColumns={this.numberOfFrozenCells()}
					numFrozenRows={0}
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
					{this.extraColumns()}
				</Table>
			</div>
		);
	}
}

HostDetails.propTypes = {
	hostData: PropTypes.array.isRequired,
	hostDetailsWidth: PropTypes.number.isRequired,
	hostDetailsHeight: PropTypes.number.isRequired
};
