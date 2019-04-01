import { receivePing } from "./messagehandlers/Ping";
import { receiveGenericError } from "./messagehandlers/GenericError";
import { receiveGenericInfo } from "./messagehandlers/GenericInfo";
import { receiveAllSubnets } from "./messagehandlers/AllSubnets";
import { receiveSomeSubnets } from "./messagehandlers/SomeSubnets";
import { receiveSomeHosts } from "./messagehandlers/SomeHosts";
import { receiveSpecificHosts } from "./messagehandlers/SpecificHosts";
import { receiveHistory } from "./messagehandlers/History";
import { receiveDebugLog } from "./messagehandlers/DebugLog";
import { receiveManualPingScan } from "./messagehandlers/ManualPingScan";

export const messageHandlers = {
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
