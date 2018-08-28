import React from "react";
import PropTypes from "prop-types";

import { Dialog, Classes, Tab, Tabs } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import { TabList } from "./AdvancedOverlayMenus/TabList.js";
import { Pingsweep } from "./AdvancedOverlayMenus/Pingsweep.js";
//import { Visualization } from "./AdvancedOverlayMenus/Visualization.js";

export class AdvancedOverlay extends React.PureComponent {
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
								onChange={nextTab => {
									switch (nextTab) {
										case "scan":
											break;
										case "history":
											this.props.handleUserAction({ action: "getHistoryData" });
											break;
										case "debug":
											this.props.handleUserAction({ action: "getDebugData" });
											break;
										default:
											console.log("unknown tab id:", nextTab);
											return;
									}
									this.props.handleUserAction({
										action: "setSelectedTabId",
										value: nextTab
									});
								}}
								selectedTabId={this.props.selectedTabId}
								renderActiveTabPanelOnly={true}
							>
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
								<Tab id="usage" title="Visualization" disabled={true} panel={<div />} />
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
	scanTarget: PropTypes.string.isRequired,
	selectedTabId: PropTypes.string.isRequired,
	subnetData: PropTypes.array.isRequired
};
