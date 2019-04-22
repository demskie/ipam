import React from "react";

import { Dialog, H4 } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import Tabs, { TabPane } from "rc-tabs";
import TabContent from "rc-tabs/lib/TabContent";
import ScrollableInkTabBar from "rc-tabs/lib/ScrollableInkTabBar";

import { TabList } from "./advancedprompt/TabList";
import { MainState as BasicTextOverlayProps, CHANCE, getFakeHostname } from "./Main";
import { messageSenders } from "./websocket/MessageHandlers";
import { ScanTarget } from "./websocket/messagehandlers/ManualPingScan";

interface BasicTextOverlayState {}

export enum BasicTextOverlayMode {
	CLOSED,
	HISTORY,
	DEBUG,
	PINGSWEEP
}

export class BasicTextOverlay extends React.PureComponent<BasicTextOverlayProps, BasicTextOverlayState> {
	private refresher?: NodeJS.Timeout;

	constructor(props: BasicTextOverlayProps) {
		super(props);
		this.refresher = this.recreateInterval();
	}

	componentDidUpdate(prevProps: BasicTextOverlayProps) {
		if (this.props.basicTextOverlayMode !== prevProps.basicTextOverlayMode) {
			this.refresher = this.recreateInterval();
		}
	}

	recreateInterval() {
		console.debug("new basicTextOverlayMode:", this.props.basicTextOverlayMode);
		switch (this.props.basicTextOverlayMode) {
			case BasicTextOverlayMode.HISTORY:
				messageSenders.sendHistory(this.props.websocket);
				return setInterval(() => messageSenders.sendHistory(this.props.websocket), 1000);
			case BasicTextOverlayMode.DEBUG:
				messageSenders.sendDebugLog(this.props.websocket);
				return setInterval(() => messageSenders.sendDebugLog(this.props.websocket), 1000);
		}
		if (this.refresher) {
			clearInterval(this.refresher);
		}
	}

	componentWillUnmount() {
		if (this.refresher) {
			clearInterval(this.refresher);
		}
	}

	scanTargetToString(scanTarget: ScanTarget) {
		const result = [] as string[];
		for (var entry of scanTarget.entries) {
			let s = "\u00A0\u00A0\u00A0\u00A0" + entry.address;
			s += "\u00A0\u00A0\u00A0\u00A0";
			s += "\u00A0\u00A0\u00A0\u00A0";
			if (entry.latency === -1) {
				s += "pendingScan";
			} else {
				s += entry.latency > 0 ? `${entry.latency}ms` : "unreachable";
			}
			if (this.props.demoMode) {
				entry.hostname = getFakeHostname(entry.address);
			}
			while (s.length < 42) s += "\u00A0";
			s += "\u00A0\u00A0" + entry.hostname;
			result.push(s);
		}
		return result;
	}

	scanTargetsToTabPanes(scanTargets: ScanTarget[]) {
		const result = [] as JSX.Element[];
		for (var scanTarget of scanTargets) {
			result.push(<TabPane tab={scanTarget.target} key={scanTarget.target} />);
		}
		return result;
	}

	render() {
		let overlayWidth = this.props.basicTextOverlayWidth;
		let overlayHeight = this.props.basicTextOverlayHeight;
		let panelWidth = this.props.basicTextOverlayWidth - 40;
		let panelHeight = this.props.basicTextOverlayHeight;

		let header = "";
		let someStrings = [] as string[];
		let headerContent = undefined as undefined | JSX.Element;

		if (this.props.basicTextOverlayMode === BasicTextOverlayMode.HISTORY) {
			header = "Commit Log";
			someStrings = this.props.historyData;
		} else if (this.props.basicTextOverlayMode === BasicTextOverlayMode.DEBUG) {
			header = "Server Log";
			someStrings = this.props.debugData;
		} else if (this.props.basicTextOverlayMode === BasicTextOverlayMode.PINGSWEEP) {
			header = "Network Scanner Results";
			someStrings = ["nothing to see here"];
			overlayWidth = 650;
			panelWidth = overlayWidth - 40;
			let selectedScanTarget = this.props.scanTargets.length > 0 ? this.props.scanTargets[0].target : "";
			for (var scanTarget of this.props.scanTargets) {
				if (scanTarget.target === this.props.selectedScanTarget) {
					selectedScanTarget = scanTarget.target;
					someStrings = this.scanTargetToString(scanTarget);
					break;
				}
				if (scanTarget.target === selectedScanTarget) {
					someStrings = this.scanTargetToString(scanTarget);
				}
			}
			if (true || selectedScanTarget !== "") {
				headerContent = (
					<Tabs
						defaultActiveKey={selectedScanTarget}
						onChange={(key: string) => this.props.triggers.selectScanTarget(key)}
						renderTabBar={() => <ScrollableInkTabBar />}
						renderTabContent={() => <TabContent />}
					>
						{this.scanTargetsToTabPanes(this.props.scanTargets)}
					</Tabs>
				);
			}
		}
		return (
			<div id="basicTextOverlay">
				<Dialog
					className={this.props.darkMode ? "bp3-dark" : "bp3-dark"}
					style={{ width: `${overlayWidth}px`, minHeight: `${overlayHeight}px`, color: "black" }}
					isOpen={this.props.basicTextOverlayMode !== BasicTextOverlayMode.CLOSED}
					onClose={() => this.props.triggers.setBasicTextOverlayMode(BasicTextOverlayMode.CLOSED)}
				>
					<H4 style={{ margin: "10px", marginBottom: "5px", textAlign: "center" }}>{header}</H4>
					<div style={{ color: "white" }}>{headerContent}</div>
					<Flex justify="center" style={{ marginTop: "10px" }}>
						<Box>
							<TabList
								darkMode={this.props.darkMode}
								data={someStrings}
								panelWidth={panelWidth}
								panelHeight={panelHeight}
							/>
						</Box>
					</Flex>
				</Dialog>
			</div>
		);
	}
}
