import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Tab, Tabs } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import classNames from "classnames";
import { List } from "react-virtualized";

export class AdvancedOverlay extends React.PureComponent {
	constructor() {
		super();
		this.state = {
			selectedTabId: "history",
			panelHeight: window.document.body.clientHeight * 0.8,
			panelWidth: window.document.body.clientWidth * 0.8 - 40
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
								<Tab
									id="history"
									title="History"
									panel={
										<div
											style={{
												width: this.state.panelWidth + "px",
												height: this.state.panelHeight + "px",
												backgroundColor: "#232d35",
												borderRadius: "9px",
												paddingLeft: "10px",
												paddingTop: "10px"
											}}
										>
											<List
												height={this.state.panelHeight - 10}
												rowCount={this.props.historyData.length}
												rowHeight={26}
												rowRenderer={obj => {
													return (
														<div className="virtualRow" key={obj.key} style={obj.style}>
															{this.props.historyData[obj.index]}
														</div>
													);
												}}
												width={this.state.panelWidth - 15}
											/>
										</div>
									}
								/>
								<Tab
									id="debug"
									title="Debug"
									panel={
										<div
											style={{
												width: this.state.panelWidth + "px",
												height: this.state.panelHeight + "px",
												backgroundColor: "#232d35",
												borderRadius: "9px",
												paddingLeft: "10px",
												paddingTop: "10px"
											}}
										>
											<List
												height={this.state.panelHeight - 10}
												rowCount={this.props.debugData.length}
												rowHeight={26}
												rowRenderer={obj => {
													return (
														<div className="virtualRow" key={obj.key} style={obj.style}>
															{this.props.debugData[obj.index]}
														</div>
													);
												}}
												width={this.state.panelWidth - 15}
											/>
										</div>
									}
								/>
								<Tab
									id="scan"
									title="Pingsweep"
									disabled={true}
									panel={
										<div style={{ width: "calc(80vw - 40px)", height: "80vh" }}>
											<h1 style={{ textAlign: "center" }}>{"MANUAL SCAN TEST"}</h1>
										</div>
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

AdvancedOverlay.propTypes = {
	historyData: PropTypes.array,
	requestHistoryData: PropTypes.func,
	debugData: PropTypes.array,
	requestDebugData: PropTypes.func,
	isOpen: PropTypes.bool,
	sendUserAction: PropTypes.func
};
