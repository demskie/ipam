import { receivePing, sendPing } from "./messagehandlers/Ping";
import { receiveGenericError } from "./messagehandlers/GenericError";
import { receiveGenericInfo } from "./messagehandlers/GenericInfo";
import { receiveAllSubnets, sendAllSubnets } from "./messagehandlers/AllSubnets";
import { receiveSomeSubnets, sendSomeSubnets } from "./messagehandlers/SomeSubnets";
import { receiveSomeHosts, sendSomeHosts } from "./messagehandlers/SomeHosts";
import { receiveSpecificHosts, sendSpecificHosts } from "./messagehandlers/SpecificHosts";
import { receiveHistory, sendHistory } from "./messagehandlers/History";
import { receiveDebugLog, sendDebugLog } from "./messagehandlers/DebugLog";
import { receiveManualPingScan, sendManualPingScan } from "./messagehandlers/ManualPingScan";

export const messageReceivers = {
	receivePing,
	receiveGenericError,
	receiveGenericInfo,
	receiveAllSubnets,
	receiveSomeSubnets,
	receiveSomeHosts,
	receiveSpecificHosts,
	receiveHistory,
	receiveDebugLog,
	receiveManualPingScan
};

export const messageSenders = {
	sendPing,
	sendAllSubnets,
	sendSomeSubnets,
	sendSomeHosts,
	sendSpecificHosts,
	sendHistory,
	sendDebugLog,
	sendManualPingScan
};
