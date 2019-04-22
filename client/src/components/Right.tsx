import React from "react";
import { Cell, Column, Table, RenderMode } from "@blueprintjs/table";
import { getFakeHostname } from "./Main";

const addressWidth = 150;
const aRecordWidth = 260;
const pingResultWidth = 120;
const lastAttemptWidth = 160;
const extraDataWidth = 160;

export interface HostData {
	addresses: string[];
	aRecords: string[];
	pingResults: string[];
	lastAttempts: string[];
	customData: string[][];
}

interface RightProps {
	darkMode: boolean;
	demoMode: boolean;
	hostData: HostData;
	hostDetailsWidth: number;
	hostDetailsHeight: number;
}

interface RightState {}

export class Right extends React.PureComponent<RightProps, RightState> {
	getRowCount = () => {
		const rowCount = this.props.hostData.aRecords.length;
		if (rowCount < 128) {
			return 128;
		}
		return rowCount;
	};

	columnWidthArray = () => {
		if (this.props.hostData.customData && this.props.hostData.customData.length > 0) {
			const widthArray = [addressWidth, aRecordWidth, pingResultWidth, lastAttemptWidth];
			this.props.hostData.customData.forEach(() => {
				widthArray.push(extraDataWidth);
			});
			return widthArray;
		}
		const width = (this.props.hostDetailsWidth - 25) / 4;
		return [width, width, width, width];
	};

	addressRenderer = (rowIndex: number) => {
		if (this.props.hostData.addresses.length > rowIndex) {
			const value = this.props.hostData.addresses[rowIndex];
			return (
				<Cell key={`address#:${rowIndex}`} tooltip={value}>
					<React.Fragment>
						<div style={{ textAlign: "center" }}>{value}</div>
					</React.Fragment>
				</Cell>
			);
		}
		return <Cell key={`address#:${rowIndex}`} />;
	};

	aRecordRenderer = (rowIndex: number) => {
		if (this.props.hostData.aRecords.length > rowIndex) {
			let value = this.props.hostData.aRecords[rowIndex];
			if (this.props.demoMode) {
				value = getFakeHostname(this.props.hostData.addresses[rowIndex]);
			}
			return (
				<Cell key={`aRecord#:${rowIndex}`} tooltip={value}>
					<React.Fragment>
						<div style={{ textAlign: "center" }}>{value}</div>
					</React.Fragment>
				</Cell>
			);
		}
		return <Cell key={`aRecord#:${rowIndex}`} />;
	};

	pingResultRenderer = (rowIndex: number) => {
		if (this.props.hostData.pingResults.length > rowIndex) {
			const value = this.props.hostData.pingResults[rowIndex];
			if (value[0] === "-") {
				return (
					<Cell key={`pingResult#:${rowIndex}`}>
						<React.Fragment>
							<div style={{ textAlign: "center", color: "rgb(255, 0, 0)" }}>{"unreachable"}</div>
						</React.Fragment>
					</Cell>
				);
			}
			return (
				<Cell key={`pingResult#:${rowIndex}`}>
					<React.Fragment>
						<div style={{ textAlign: "center", color: "rgb(0, 240, 0)" }}>{value}</div>
					</React.Fragment>
				</Cell>
			);
		}
		return <Cell key={`pingResult#:${rowIndex}`} />;
	};

	lastAttemptRenderer = (rowIndex: number) => {
		if (this.props.hostData.lastAttempts.length > rowIndex) {
			const value = this.props.hostData.lastAttempts[rowIndex];
			if (value === "") {
				return (
					<Cell key={`lastAttempt#:${rowIndex}`}>
						<React.Fragment>
							<div style={{ textAlign: "center", color: "rgb(255, 165, 0)" }}>{"pending"}</div>
						</React.Fragment>
					</Cell>
				);
			}
			return (
				<Cell key={`lastAttempt#:${rowIndex}`}>
					<React.Fragment>
						<div style={{ textAlign: "center" }}>{value}</div>
					</React.Fragment>
				</Cell>
			);
		}
		return <Cell key={`pingResult#:${rowIndex}`} />;
	};

	extraColumns = () => {
		let arrayOfColumns = [] as any;
		this.props.hostData.customData.forEach((arr: string[], idx: number) => {
			arrayOfColumns.push(
				<Column
					key={`parent:${arr[0]}`}
					name={(<div style={{ textAlign: "center" }}>{arr[0]}</div> as unknown) as string}
					cellRenderer={(rowIndex: number) => {
						if (rowIndex < arr.length) {
							return (
								<Cell key={`${arr[0]}#:${rowIndex}`} tooltip={arr[rowIndex + 1]}>
									<React.Fragment>
										<div style={{ textAlign: "center" }}>{arr[rowIndex + 1]}</div>
									</React.Fragment>
								</Cell>
							);
						}
						return <Cell key={`${arr[0]}#:${rowIndex}`} />;
					}}
				/>
			);
		});
		return arrayOfColumns;
	};

	render() {
		return (
			<div id="hostDetails" style={{ height: this.props.hostDetailsHeight }}>
				<Table
					className={this.props.darkMode ? "bp3-dark" : ""}
					numRows={this.getRowCount()}
					renderMode={RenderMode.NONE}
					enableGhostCells={true}
					columnWidths={this.columnWidthArray()}
					enableColumnResizing={false}
					enableRowHeader={false}
					numFrozenColumns={0}
					numFrozenRows={0}
				>
					<Column
						name={(<div style={{ textAlign: "center" }}>{"Address"}</div> as unknown) as string}
						cellRenderer={this.addressRenderer}
					/>
					<Column
						name={(<div style={{ textAlign: "center" }}>{"A Record"}</div> as unknown) as string}
						cellRenderer={this.aRecordRenderer}
					/>
					<Column
						name={(<div style={{ textAlign: "center" }}>{"Ping Result"}</div> as unknown) as string}
						cellRenderer={this.pingResultRenderer}
					/>
					<Column
						name={(<div style={{ textAlign: "center" }}>{"Last Attempt"}</div> as unknown) as string}
						cellRenderer={this.lastAttemptRenderer}
					/>
					{this.extraColumns()}
				</Table>
			</div>
		);
	}
}

export const defaultHostData = {
	addresses: [],
	aRecords: [],
	pingResults: [],
	lastAttempts: [],
	customData: []
};
