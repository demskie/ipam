/// <reference types="react-scripts" />

declare module "reflexbox" {
	import * as React from "react";

	export interface BoxProps {
		w?: number | string;
		h?: number | string;

		flex?: boolean;
		wrap?: boolean;
		column?: boolean;
		auto?: boolean;
		order?: number;
		align?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
		justify?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";

		m?: number | string;
		mx?: number | string;
		my?: number | string;
		mt?: number | string;
		mb?: number | string;
		ml?: number | string;
		mr?: number | string;

		p?: number | string;
		px?: number | string;
		py?: number | string;
		pt?: number | string;
		pb?: number | string;
		pl?: number | string;
		pr?: number | string;

		style?: any;
	}

	export class Flex extends React.Component<BoxProps> {}
	export class Box extends React.Component<BoxProps> {}
}

declare module "react-trend" {
	interface Props {
		autoDraw?: boolean;
		autoDrawDuration?: number;
		autoDrawEasing?: string;
		data: number[] | Array<{ value: number }>;
		gradient?: string[];
		height?: number;
		padding?: number;
		radius?: number;
		smooth?: boolean;
		stroke?: string;
		strokeDasharray?: number[];
		strokeDashoffset?: number;
		strokeLinecap?: "butt" | "square" | "round";
		strokeLinejoin?: string;
		strokeOpacity?: number;
		strokeWidth?: number;
		width?: number;
	}
	export default class Trend extends React.Component<Props> {}
}

// import Tabs, { TabPane } from 'rc-tabs';
// import TabContent from 'rc-tabs/lib/TabContent';
// import ScrollableInkTabBar from 'rc-tabs/lib/ScrollableInkTabBar';

declare module "rc-tabs" {
	import * as React from "react";

	export interface TabsProps {
		activeKey?: string;
		tabBarPosition?: "left" | "right" | "top" | "bottom";
		defaultActiveKey: string;
		renderTabBar: () => React.Node;
		renderTabContent: () => React.Node;
		navWrapper?: (tabContent: React.Node) => React.Node;
		onChange: (key: string) => void;
		destroyInactiveTabPane?: boolean;
		prefixCls?: string;
	}

	export interface TabPaneProps {
		key: string;
		style?: any;
		placeholder?: React.Node;
		tab: string;
		forceRender?: boolean;
	}

	export default class Tabs extends React.Component<TabsProps> {}
	export class TabPane extends React.Component<TabPaneProps> {}
}

declare module "rc-tabs/lib/TabContent" {
	import * as React from "react";

	export interface TabContentProps {
		style?: any;
		animated?: boolean;
		animatedWithMargin?: boolean;
	}

	export default class TabContent extends React.Component<TabContentProps> {}
}

declare module "rc-tabs/lib/ScrollableInkTabBar" {
	import * as React from "react";

	export interface ScrollableInkTabBarProps {
		children?: (node: React.Node) => React.Node;
	}

	export default class ScrollableInkTabBar extends React.Component<ScrollableInkTabBarProps> {}
}
