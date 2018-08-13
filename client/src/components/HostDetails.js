import React from "react";
import PropTypes from "prop-types";
import debounce from "debounce";
import { Cell, Column, Table, RenderMode } from "@blueprintjs/table";

export class HostDetails extends React.Component {
	constructor() {
		super();
		this.state = {
			columnWidthArrays: null
		};
	}

	updateColumnWidthArrays = () => {
		let width = document.getElementById("hostDetails").clientWidth / 4;
		this.setState({
			columnWidthArrays: [width, width, width, width]
		});
	};

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateColumnWidthArrays, 500));
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
			<div id="hostDetails">
				<Table
					className="bp3-dark"
					numRows={1024}
					renderMode={RenderMode.NONE}
					enableGhostCells={true}
					columnWidths={this.state.columnWidthArrays}
					enableRowHeader={false}
				>
					<Column name="Address" cellRenderer={addressRenderer} />
					<Column name="A Record" cellRenderer={aRecordRenderer} />
					<Column name="Ping Result" cellRenderer={pingResultRenderer} />
					<Column name="Last Attempt" cellRenderer={lastAttemptRenderer} />
				</Table>
			</div>
		);
	}
}

HostDetails.propTypes = {
	details: PropTypes.object
};
