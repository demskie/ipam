import { Subnet } from "../left/SubnetTree";
import { HostData } from "../Right";

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
}

export type globallyUniqueID = string;

export interface outboundPing extends base {
	messageType: kind.Ping;
	guid: globallyUniqueID;
}

export interface inboundPing extends base {
	messageType: kind.Ping;
	guidEcho: globallyUniqueID;
}

export interface inboundServerError extends base {
	messageType: kind.GenericError;
	guidEcho: globallyUniqueID;
	errorType: serverErrorTypes;
	errorValue: string;
}

export interface inboundGenericInfo extends base {
	messageType: kind.GenericInfo;
	guidEcho: globallyUniqueID;
	info: string;
}

export interface outboundAllSubnets extends base {
	messageType: kind.AllSubnets;
	guid: globallyUniqueID;
}

export interface inboundAllSubnets extends base {
	messageType: kind.AllSubnets;
	guidEcho: globallyUniqueID;
	subnets: Subnet[];
}

export interface outboundSomeSubnets extends base {
	messageType: kind.SomeSubnets;
	guid: globallyUniqueID;
	filter: string;
}

export interface inboundSomeSubnets extends base {
	messageType: kind.SomeSubnets;
	guidEcho: globallyUniqueID;
	subnets: Subnet[];
}

export interface outboundSpecificHosts extends base {
	messageType: kind.SpecificHosts;
	guid: globallyUniqueID;
	network: string;
}

export interface inboundSpecificHosts extends base {
	messageType: kind.SpecificHosts;
	guidEcho: globallyUniqueID;
	hosts: HostData;
}

export interface outboundSomeHosts extends base {
	messageType: kind.SomeHosts;
	guid: globallyUniqueID;
	filter: string;
}

export interface inboundSomeHosts extends base {
	messageType: kind.SomeHosts;
	guidEcho: globallyUniqueID;
	hosts: HostData;
}

export enum kind2 {
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
