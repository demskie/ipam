import { receivePing, sendPing } from "./messagehandlers/Ping";
import { receiveGenericError } from "./messagehandlers/GenericError";
import { receiveGenericInfo } from "./messagehandlers/GenericInfo";
import { receiveAllSubnets, sendAllSubnets } from "./messagehandlers/AllSubnets";
import { receiveSomeHosts, sendSomeHosts } from "./messagehandlers/SomeHosts";
import { receiveSpecificHosts, sendSpecificHosts } from "./messagehandlers/SpecificHosts";
import { receiveHistory, sendHistory } from "./messagehandlers/History";
import { receiveDebugLog, sendDebugLog } from "./messagehandlers/DebugLog";
import { receiveManualPingScan, sendManualPingScan } from "./messagehandlers/ManualPingScan";
import { sendCreateSubnet } from "./messagehandlers/CreateSubnet";
import { sendModifySubnet } from "./messagehandlers/ModifySubnet";
import { sendDeleteSubnet } from "./messagehandlers/DeleteSubnet";

export const messageReceivers = {
	receivePing,
	receiveGenericError,
	receiveGenericInfo,
	receiveAllSubnets,
	receiveSomeHosts,
	receiveSpecificHosts,
	receiveHistory,
	receiveDebugLog,
	receiveManualPingScan
};

export const messageSenders = {
	sendPing,
	sendAllSubnets,
	sendSomeHosts,
	sendSpecificHosts,
	sendHistory,
	sendDebugLog,
	sendManualPingScan,
	sendCreateSubnet,
	sendModifySubnet,
	sendDeleteSubnet
};
