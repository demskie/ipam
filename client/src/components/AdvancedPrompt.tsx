import React from "react";

import { Dialog, Classes, Tab, Tabs } from "@blueprintjs/core";
import { Flex, Box } from "reflexbox";
import { TabList } from "./advancedprompt/TabList";
import { Pingsweep } from "./advancedprompt/Pingsweep";
import { MainState as AdvancedProps } from "./Main";

interface AdvancedState {}

export enum AdvancedPromptMode {
	CLOSED,
	HISTORY,
	DEBUG,
	PINGSWEEP
}

export class AdvancedPrompt extends React.PureComponent<AdvancedProps, AdvancedState> {
	render() {
		const advancedWidth = this.props.advancedPromptWidth;
		const advancedHeight = this.props.advancedPromptHeight;
		const panelWidth = this.props.advancedPromptWidth - 40;
		const panelHeight = this.props.advancedPromptHeight;
		return (
			<div id="advancedPrompt">
				<Dialog
					className={Classes.DARK}
					style={{ width: `${advancedWidth}px`, minHeight: `${advancedHeight}px` }}
					isOpen={this.props.advancedPromptMode !== AdvancedPromptMode.CLOSED}
					onClose={() => this.props.triggers.setAdvancedPromptMode(AdvancedPromptMode.CLOSED)}
				>
					<Flex justify="center">
						<Box>
							<Tabs
								id="advancedOverlayTabs"
								className={Classes.LARGE}
								onChange={(nextTab: AdvancedPromptMode) => this.props.triggers.setAdvancedPromptMode(nextTab)}
								selectedTabId={this.props.advancedPromptMode}
								renderActiveTabPanelOnly={true}
							>
								<Tab
									id={AdvancedPromptMode.HISTORY}
									title="History"
									disabled={false}
									panel={<TabList data={this.props.historyData} panelWidth={panelWidth} panelHeight={panelHeight} />}
								/>
								<Tab
									id={AdvancedPromptMode.DEBUG}
									title="Debug"
									disabled={false}
									panel={<TabList data={this.props.debugData} panelWidth={panelWidth} panelHeight={panelHeight} />}
								/>
								<Tab
									id={AdvancedPromptMode.PINGSWEEP}
									title="Pingsweep"
									disabled={false}
									panel={
										<Pingsweep
											scanData={this.props.scanData}
											scanTarget={this.props.scanTarget}
											triggers={this.props.triggers}
											panelWidth={panelWidth}
											panelHeight={panelHeight}
										/>
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
