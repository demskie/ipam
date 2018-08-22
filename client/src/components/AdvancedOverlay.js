import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Tab, Tabs } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import { TabList } from "./AdvancedOverlayMenus/TabList.js";
import { Pingsweep } from "./AdvancedOverlayMenus/Pingsweep.js";

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
		switch (newTab) {
			case "history":
				this.props.handleUserAction({ action: "getHistoryData" });
				break;
			case "debug":
				this.props.handleUserAction({ action: "getDebugData" });
				break;
			case "scan":
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
									panel={<TabList data={this.props.historyData} panelWidth={panelWidth} panelHeight={panelHeight} />}
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
										<Pingsweep
											scanData={this.props.scanData}
											scanTarget={this.props.scanTarget}
											handleUserAction={this.props.handleUserAction}
											panelWidth={panelWidth}
											panelHeight={panelHeight}
										/>
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
	scanData: PropTypes.array.isRequired,
	scanTarget: PropTypes.string.isRequired
};
