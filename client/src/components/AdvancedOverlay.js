import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Tab, Tabs, Button, InputGroup, Intent } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import classNames from "classnames";
import { List } from "react-virtualized";
import { TabList } from "./AdvancedOverlayMenus/TabList.js";

export class AdvancedOverlay extends React.PureComponent {
	constructor() {
		super();
		this.state = {
			selectedTabId: "history",
			panelHeight: window.document.body.clientHeight * 0.8,
			panelWidth: window.document.body.clientWidth * 0.8 - 40,
			pingsweepInputValue: "",
			pingsweepRowCount: 12
		};
	}

	handleTabChange = newTab => {
		this.setState({
			selectedTabId: newTab
		});
		switch (newTab) {
			case "history":
				this.props.requestHistoryData();
				break;
			case "debug":
				this.props.requestDebugData();
				break;
			default:
				console.log("unknown tab id:", newTab);
		}
	};

	componentDidMount = () => {
		window.addEventListener("resize", () => {
			this.setState({
				panelHeight: window.document.body.clientHeight * 0.8,
				panelWidth: window.document.body.clientWidth * 0.8 - 40
			});
		});
	};

	//

	render() {
		return (
			<div id="advancedOverlay">
				<Dialog
					className={classNames(Classes.DARK)}
					style={{ width: "80vw", minHeight: "80vh" }}
					isOpen={this.props.isOpen}
					onClose={() => {
						this.props.sendUserAction({ action: "closeAdvancedOverlay" });
					}}
				>
					<Flex justify="center">
						<Box>
							<Tabs
								id="advancedOverlayTabs"
								className={Classes.LARGE}
								onChange={this.handleTabChange}
								selectedTabId={this.selectedTabId}
								renderActiveTabPanelOnly={true}
							>
								<TabList
									id="history"
									title="History"
									panelWidth={this.state.panelWidth}
									panelHeight={this.state.panelHeight}
									data={this.props.historyData}
								/>
								<TabList
									id="debug"
									title="Debug"
									panelWidth={this.state.panelWidth}
									panelHeight={this.state.panelHeight}
									data={this.props.debugData}
								/>
								<Tab
									id="scan"
									title="Pingsweep"
									disabled={false}
									panel={
										<Flex
											column
											align="center"
											style={{
												width: this.state.panelWidth + "px",
												height: this.state.panelHeight + "px",
												backgroundColor: "#232d35",
												borderRadius: "9px"
											}}
										>
											<Box>
												<List
													height={this.state.panelHeight}
													rowCount={this.state.pingsweepRowCount + 1}
													rowHeight={50}
													rowRenderer={obj => {
														if (obj.index === 0) {
															return (
																<div className="virtualScanRow" key={obj.key} style={obj.style}>
																	{
																		<Flex column align="center" style={{ paddingTop: "10px" }}>
																			<Box>
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
																<div className="virtualScanRow" key={obj.key} style={obj.style}>
																	{"PING RESULT " + (obj.index - 1).toString()}
																</div>
															);
														}
													}}
													width={this.state.panelWidth - 15}
												/>
											</Box>
										</Flex>
									}
								/>
								<Tab
									id="usage"
									title="Visualization"
									disabled={true}
									panel={
										<div style={{ width: "calc(80vw - 40px)", height: "80vh" }}>
											<h1 style={{ textAlign: "center" }}>{"MANUAL SCAN TEST"}</h1>
										</div>
									}
								/>
							</Tabs>
						</Box>
					</Flex>
				</Dialog>
			</div>
		);
	}
}

const scanData = [];

AdvancedOverlay.propTypes = {
	historyData: PropTypes.array,
	requestHistoryData: PropTypes.func,
	debugData: PropTypes.array,
	requestDebugData: PropTypes.func,
	scanData: PropTypes.array,
	isOpen: PropTypes.bool,
	sendUserAction: PropTypes.func
};
