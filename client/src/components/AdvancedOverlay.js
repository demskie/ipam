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
			selectedTabId: "history"
		};
	}

	handleTabChange = newTab => {
		this.setState({
			selectedTabId: newTab
		});
	};

	render() {
		const history = this.props.historyData;
		const createHistoryItems = () => {
			let items = new Array(this.props.historyData.length);
			for (let i = 0; i < items.length; i++) {
				items[i] = (
					<li key={i} style={{ paddingBottom: "7px" }}>
						{this.props.historyData[i]}
					</li>
				);
			}
			console.log(items);
			return items;
		};

		const debug = this.props.debugData;
		const debugItems = debug.map((line, index) => (
			<li key={index} style={{ paddingBottom: "7px" }}>
				{line}
			</li>
		));
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
												width: "calc(80vw - 40px)",
												height: "80vh",
												overflow: "auto",
												backgroundColor: "#232d35",
												borderRadius: "9px"
											}}
										>
											<ul
												style={{
													paddingLeft: "15px",
													paddingTop: "15px",
													marginTop: "0px",
													marginBottom: "0px",
													listStyle: "none",
													fontFamily: "Fira Mono, monospace"
												}}
											>
												{createHistoryItems()}
											</ul>
										</div>
									}
								/>
								<Tab
									id="debug"
									title="Debug"
									panel={
										<div
											style={{
												width: "calc(80vw - 40px)",
												height: "80vh",
												overflow: "auto",
												backgroundColor: "#232d35",
												borderRadius: "9px"
											}}
										>
											<ul
												style={{
													paddingLeft: "15px",
													paddingTop: "15px",
													marginTop: "0px",
													marginBottom: "0px",
													listStyle: "none",
													fontFamily: "Fira Mono, monospace"
												}}
											>
												{debugItems}
											</ul>
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
	debugData: PropTypes.array,
	isOpen: PropTypes.bool,
	sendUserAction: PropTypes.func
};
