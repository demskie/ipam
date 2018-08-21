import React from "react";
import PropTypes from "prop-types";

import { Card, Elevation, Button, InputGroup, Intent } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import { List } from "react-virtualized";

export class Pingsweep extends React.PureComponent {
	constructor() {
		super();
		this.state = {
			pingsweepInputValue: ""
		};
	}

	calculateRowCount = pingSweepCardsPerRow => {
		if (this.props.scanData.length % pingSweepCardsPerRow !== 0) {
			return this.props.scanData.length / pingSweepCardsPerRow + 1;
		} else {
			return this.props.scanData.length / pingSweepCardsPerRow;
		}
	};

	render() {
		const cardWidth = 190;
		const cardHeight = 80;
		const pingSweepCardsPerRow = Math.floor(this.props.panelWidth / cardWidth);
		const pingSweepRowCount = this.calculateRowCount(pingSweepCardsPerRow);
		const generateRow = rowIndex => {
			const start = rowIndex * pingSweepCardsPerRow;
			const stop = start + pingSweepCardsPerRow;
			let results = [];
			for (let i = start; i < stop; i++) {
				if (i >= this.props.scanData.length) {
					break;
				}
				let textColor = "rgb(0, 240, 0)";
				if (this.props.scanData[i][3] === "pending") {
					textColor = "rgb(255, 165, 0)";
				} else if (this.props.scanData[i][1] === "unreachable") {
					textColor = "rgb(255, 0, 0)";
				}
				results.push(
					<Box key={i} px={1}>
						<Card
							className="bp3-dark"
							interactive={true}
							elevation={Elevation.THREE}
							style={{
								width: cardWidth + "px",
								height: cardHeight - 20 + "px",
								paddingLeft: "10px",
								paddingRight: "10px",
								overflow: "hidden",
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								textAlign: "center",
								fontWeight: "500",
								color: textColor
							}}
						>
							{this.props.scanData[i][0]}
						</Card>
					</Box>
				);
			}

			return <Flex>{results}</Flex>;
		};
		return (
			<Flex
				column
				align="center"
				style={{
					width: this.props.panelWidth + "px",
					height: this.props.panelHeight + "px",
					backgroundColor: "#232d35",
					borderRadius: "9px"
				}}
			>
				<Box>
					<List
						height={this.props.panelHeight}
						rowCount={pingSweepRowCount + 1}
						rowHeight={cardHeight}
						rowRenderer={obj => {
							if (obj.index === 0) {
								return (
									<div className="virtualScanRow" key={obj.key} style={obj.style}>
										{
											<Flex column align="center">
												<Box style={{ paddingTop: "20px" }}>
													<InputGroup
														disabled={false}
														intent={Intent.NONE}
														large={true}
														leftIcon="search"
														onChange={ev => this.setState({ pingsweepInputValue: ev.target.value })}
														placeholder="192.168.128.0/24"
														rightElement={
															<Button
																className="bp3-minimal"
																icon="chevron-down"
																intent={Intent.PRIMARY}
																onClick={() => {
																	console.log("pingsweep button was clicked");
																}}
															/>
														}
														type="search"
														value={this.state.pingsweepInputValue}
													/>
												</Box>
											</Flex>
										}
									</div>
								);
							} else {
								return (
									<div key={obj.key} style={obj.style}>
										<Flex column align="center">
											<Box>{generateRow(obj.index - 1)}</Box>
										</Flex>
									</div>
								);
							}
						}}
						width={this.props.panelWidth - 15}
					/>
				</Box>
			</Flex>
		);
	}
}

const _ = [
	["192.168.0.0", "23ms", "thisIsMyHostname.lan", "notPending"],
	["192.168.0.1", "24ms", "thisIsMyHostname.lan", "notPending"],
	["192.168.0.2", "unreachable", "thisIsMyHostname.lan", "notPending"],
	["192.168.0.3", "26ms", "thisIsMyHostname.lan", "notPending"],
	["192.168.0.4", "27ms", "thisIsMyHostname.lan", "pending"],
	["192.168.0.5", "28ms", "thisIsMyHostname.lan", "notPending"]
];

Pingsweep.propTypes = {
	scanData: PropTypes.array.isRequired,
	handleUserAction: PropTypes.func.isRequired,
	panelWidth: PropTypes.number.isRequired,
	panelHeight: PropTypes.number.isRequired
};
