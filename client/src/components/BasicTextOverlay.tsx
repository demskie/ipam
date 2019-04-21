import React from "react";

import { Dialog, H4 } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import Tabs, { TabPane } from "rc-tabs";
import TabContent from "rc-tabs/lib/TabContent";
import ScrollableInkTabBar from "rc-tabs/lib/ScrollableInkTabBar";

import { TabList } from "./advancedprompt/TabList";
import { MainState as BasicTextOverlayProps, CHANCE } from "./Main";
import { messageSenders } from "./websocket/MessageHandlers";

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

	render() {
		const overlayWidth = this.props.basicTextOverlayWidth;
		const overlayHeight = this.props.basicTextOverlayHeight;
		const panelWidth = this.props.basicTextOverlayWidth - 40;
		const panelHeight = this.props.basicTextOverlayHeight;

		var header = "";
		var someStrings = [] as string[];
		var headerContent = undefined as undefined | JSX.Element;

		if (this.props.basicTextOverlayMode === BasicTextOverlayMode.HISTORY) {
			header = "Commit Log";
			someStrings = this.props.historyData;
		} else if (this.props.basicTextOverlayMode === BasicTextOverlayMode.DEBUG) {
			header = "Server Log";
			someStrings = this.props.debugData;
		} else if (this.props.basicTextOverlayMode === BasicTextOverlayMode.PINGSWEEP) {
			header = "Network Scanner Results";
			someStrings = this.props.debugData;
			headerContent = (
				<Tabs
					defaultActiveKey="2"
					onChange={(key: string) => console.log(key)}
					renderTabBar={() => <ScrollableInkTabBar />}
					renderTabContent={() => <TabContent />}
				>
					<TabPane tab={CHANCE.ip()} key="1" />
					<TabPane tab={CHANCE.ip()} key="2" />
					<TabPane tab={CHANCE.ip()} key="3" />
					<TabPane tab={CHANCE.ip()} key="4" />
					<TabPane tab={CHANCE.ip()} key="5" />
					<TabPane tab={CHANCE.ip()} key="6" />
					<TabPane tab={CHANCE.ip()} key="7" />
					<TabPane tab={CHANCE.ip()} key="8" />
					<TabPane tab={CHANCE.ip()} key="9" />
					<TabPane tab={CHANCE.ip()} key="10" />
					<TabPane tab={CHANCE.ip()} key="11" />
					<TabPane tab={CHANCE.ipv6()} key="12" />
					<TabPane tab={CHANCE.ipv6()} key="13" />
					<TabPane tab={CHANCE.ipv6()} key="14" />
					<TabPane tab={CHANCE.ipv6()} key="15" />
					<TabPane tab={CHANCE.ipv6()} key="16" />
					<TabPane tab={CHANCE.ipv6()} key="17" />
					<TabPane tab={CHANCE.ipv6()} key="18" />
					<TabPane tab={CHANCE.ipv6()} key="19" />
					<TabPane tab={CHANCE.ipv6()} key="20" />
				</Tabs>
			);
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
