import { Subnet } from "../left/SubnetTree";
import { HostData } from "../Right";
import { ScanAddr } from "../advancedprompt/Pingsweep";

export enum kind {
	Ping,
	GenericError,
	GenericInfo,
	AllSubnets,
	SomeSubnets,
	SpecificHosts,
	SomeHosts,
	History,
	DebugLog,
	ManualPingScan
}

export enum serverErrorTypes {
	InvalidSubnet,
	NotSubnetZero,
	DoesNotExist,
	AlreadyExists
}

export interface base {
	messageType: kind;
	sessionGUID: string;
}

export interface outboundPing extends base {
	messageType: kind.Ping;
	sessionGUID: string;
}

export interface inboundPing extends base {
	messageType: kind.Ping;
	sessionGUID: string;
}

export interface inboundGenericError extends base {
	messageType: kind.GenericError;
	sessionGUID: string;
	errorType: serverErrorTypes;
	errorValue: string;
}

export interface inboundGenericInfo extends base {
	messageType: kind.GenericInfo;
	sessionGUID: string;
	info: string;
}

export interface outboundAllSubnets extends base {
	messageType: kind.AllSubnets;
	sessionGUID: string;
}

export interface inboundAllSubnets extends base {
	messageType: kind.AllSubnets;
	sessionGUID: string;
	subnets: Subnet[];
}

export interface outboundSomeSubnets extends base {
	messageType: kind.SomeSubnets;
	sessionGUID: string;
	filter: string;
}

export interface inboundSomeSubnets extends base {
	messageType: kind.SomeSubnets;
	sessionGUID: string;
	subnets: Subnet[];
}

export interface outboundSpecificHosts extends base {
	messageType: kind.SpecificHosts;
	sessionGUID: string;
	network: string;
}

export interface inboundSpecificHosts extends base {
	messageType: kind.SpecificHosts;
	sessionGUID: string;
	hosts: HostData;
}

export interface outboundSomeHosts extends base {
	messageType: kind.SomeHosts;
	sessionGUID: string;
	filter: string;
}

export interface inboundSomeHosts extends base {
	messageType: kind.SomeHosts;
	sessionGUID: string;
	hosts: HostData;
}

export interface outboundHistory extends base {
	messageType: kind.History;
	sessionGUID: string;
}

export interface inboundHistory extends base {
	messageType: kind.History;
	sessionGUID: string;
	history: string[];
}

export interface outboundDebugLog extends base {
	messageType: kind.DebugLog;
	sessionGUID: string;
}

export interface inboundDebugLog extends base {
	messageType: kind.DebugLog;
	sessionGUID: string;
	debugLog: string[];
}

export interface outboundManualPingScan extends base {
	messageType: kind.ManualPingScan;
	sessionGUID: string;
	network: string;
}

export interface inboundManualPingScan extends base {
	messageType: kind.ManualPingScan;
	sessionGUID: string;
	results: ScanAddr[];
}
