import React from "react";

import { Card, Elevation, Button, InputGroup, Intent } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import { List } from "react-virtualized";
import { MainTriggers } from "../Main";

var lastNonEmptyTarget = "";

interface PingsweepProps {
	darkMode: boolean;
	scanData: Array<any>;
	scanTarget: string;
	triggers: MainTriggers;
	panelWidth: number;
	panelHeight: number;
}

interface PingsweepState {
	pingsweepInputValue: string;
}

export interface ScanAddr {
	address: string;
	latency: number;
	pending: boolean;
}

export class Pingsweep extends React.PureComponent<PingsweepProps, PingsweepState> {
	state = {
		pingsweepInputValue: ""
	};

	calculateRowCount = (cardsPerRow: number) => {
		if (this.props.scanData.length % cardsPerRow !== 0) {
			return this.props.scanData.length / cardsPerRow + 1;
		} else {
			return this.props.scanData.length / cardsPerRow;
		}
	};

	render() {
		if (this.props.scanTarget !== "") {
			lastNonEmptyTarget = this.props.scanTarget;
		}
		const cardWidth = 190;
		const cardHeight = 80;
		const pingSweepCardsPerRow = Math.floor(this.props.panelWidth / (cardWidth + 20));
		const pingSweepRowCount = this.calculateRowCount(pingSweepCardsPerRow);
		const generateRow = (rowIndex: number) => {
			const start = rowIndex * pingSweepCardsPerRow;
			const stop = start + pingSweepCardsPerRow;
			let results = [];
			for (let i = start; i < stop; i++) {
				if (i >= this.props.scanData.length) {
					break;
				}
				let textColor = "rgb(0, 240, 0)";
				if (this.props.scanData[i][2] === "true") {
					textColor = "rgb(255, 165, 0)";
				} else if (parseInt(this.props.scanData[i][1], 10) < 0) {
					textColor = "rgb(255, 0, 0)";
				}
				results.push(
					<Box key={i} px={1}>
						<Card
							className={this.props.darkMode ? "bp3-dark" : ""}
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
								fontWeight: "normal",
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
														onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
															this.setState({ pingsweepInputValue: ev.target.value })
														}
														placeholder={lastNonEmptyTarget}
														rightElement={
															<Button
																className="bp3-minimal"
																icon="chevron-down"
																intent={Intent.PRIMARY}
																onClick={() => {
																	// this.props.handleUserAction({
																	// 	action: "getScanStart",
																	// 	value: this.state.pingsweepInputValue
																	// });
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
