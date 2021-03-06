import { Subnet } from "../left/SubnetTree";
import { HostData } from "../Right";
import { ScanEntry } from "./messagehandlers/ManualPingScan";

export enum kind {
	Ping,
	GenericError,
	GenericInfo,
	AllSubnets,
	SpecificHosts,
	SomeHosts,
	History,
	DebugLog,
	ManualPingScan,
	CreateSubnet,
	ModifySubnet,
	DeleteSubnet
}

export enum serverErrorTypes {
	InvalidSubnet,
	NotSubnetZero,
	DoesNotExist,
	AlreadyExists,
	AuthenticationFailure,
	UnknownFault
}

export interface SubnetRequest {
	user: string;
	pass: string;
	net: string;
	desc: string;
	notes: string;
	vlan: string;
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
	demoMode: boolean;
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
	aggregate: string;
	networks: string[];
}

export interface inboundManualPingScan extends base {
	messageType: kind.ManualPingScan;
	sessionGUID: string;
	results: ScanEntry[];
}

export interface outboundCreateSubnet extends base {
	messageType: kind.CreateSubnet;
	sessionGUID: string;
	subnetRequest: SubnetRequest;
}

export interface outboundModifySubnet extends base {
	messageType: kind.ModifySubnet;
	sessionGUID: string;
	subnetRequest: SubnetRequest;
}

export interface outboundDeleteSubnet extends base {
	messageType: kind.DeleteSubnet;
	sessionGUID: string;
	subnetRequest: SubnetRequest;
}

export type AllKnownOutboundTypes =
	| outboundPing
	| outboundAllSubnets
	| outboundSpecificHosts
	| outboundSomeHosts
	| outboundHistory
	| outboundDebugLog
	| outboundManualPingScan
	| outboundCreateSubnet
	| outboundModifySubnet
	| outboundDeleteSubnet;
