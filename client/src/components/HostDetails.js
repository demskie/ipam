import React from "react";
import debounce from "debounce";
import { Flex, Box } from "reflexbox";
import { Column, Table } from "@blueprintjs/table";

export class HostDetails extends React.Component {
	constructor() {
		super();
		this.state = {
			columnWidthArrays: null
		};
	}

	updateColumnWidthArrays = () => {
		let width = (document.getElementById("root").clientWidth * (2 / 3) - 30) / 4;
		this.setState({
			columnWidthArrays: [width, width, width, width]
		});
	};

	componentDidMount = () => {
		window.addEventListener("resize", debounce(this.updateColumnWidthArrays, 1000));
		this.updateColumnWidthArrays();
	};

	render() {
		return (
			<Box auto w={2 / 3}>
				<Table className="bp3-dark" numRows={50} columnWidths={this.state.columnWidthArrays}>
					<Column name="Address" />
					<Column name="A Record" />
					<Column name="Ping Result" />
					<Column name="Last Attempt" />
				</Table>
			</Box>
		);
	}
}
