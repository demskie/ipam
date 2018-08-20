import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Tab, Tabs, Button, InputGroup, Intent } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import { List } from "react-virtualized";
import { TabList } from "./AdvancedOverlayMenus/TabList.js";

export class AdvancedOverlay extends React.PureComponent {
	constructor() {
		super();
		this.state = {
			selectedTabId: "history",
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
				this.props.handleUserAction({ action: "getHistoryData" });
				break;
			case "debug":
				this.props.handleUserAction({ action: "getDebugData" });
				break;
			default:
				console.log("unknown tab id:", newTab);
		}
	};

	render() {
		const overlayWidth = this.props.advancedOverlayWidth;
		const overlayHeight = this.props.advancedOverlayHeight;
		const panelWidth = this.props.advancedOverlayWidth - 40;
		const panelHeight = this.props.advancedOverlayHeight;
		console.log({
			selectedTabId: this.state.selectedTabId,
			overlayWidth: overlayWidth + "px",
			overlayHeight: overlayHeight + "px"
		});
		return (
			<div id="advancedOverlay">
				<Dialog
					className={Classes.DARK}
					style={{ width: overlayWidth + "px", minHeight: overlayHeight + "px" }}
					isOpen={this.props.advancedOverlayEnabled}
					onClose={() => {
						this.props.handleUserAction({ action: "closeAdvancedOverlay" });
					}}
				>
					<Flex justify="center">
						<Box>
							<Tabs
								id="advancedOverlayTabs"
								className={Classes.LARGE}
								onChange={this.handleTabChange}
								selectedTabId={this.state.selectedTabId}
								renderActiveTabPanelOnly={true}
							>
								<Tab
									id="history"
									title="History"
									disabled={false}
									panel={<TabList data={this.props.debugData} panelWidth={panelWidth} panelHeight={panelHeight} />}
								/>
								<Tab
									id="debug"
									title="Debug"
									disabled={false}
									panel={<TabList data={this.props.debugData} panelWidth={panelWidth} panelHeight={panelHeight} />}
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
												width: panelWidth + "px",
												height: panelHeight + "px",
												backgroundColor: "#232d35",
												borderRadius: "9px"
											}}
										>
											<Box>
												<List
													height={panelHeight}
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
													width={panelWidth - 15}
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
										<div style={{ width: panelWidth + "px", height: panelWidth + "px" }}>
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

AdvancedOverlay.propTypes = {
	advancedOverlayEnabled: PropTypes.bool.isRequired,
	advancedOverlayWidth: PropTypes.number.isRequired,
	advancedOverlayHeight: PropTypes.number.isRequired,
	debugData: PropTypes.array.isRequired,
	handleUserAction: PropTypes.func.isRequired,
	historyData: PropTypes.array.isRequired,
	scanData: PropTypes.array.isRequired
};
