import Net from "@rbxts/net";
import { ZrRuntimeErrorCode } from "@rbxts/zirconium/out/Runtime/Runtime";
import { RemoteId } from "../RemoteId";
import { ZrParserErrorCode } from "@rbxts/zirconium-ast/out/Parser";
import { ZirconLogLevel } from "../Client/Types";
import createPermissionMiddleware from "./NetPermissionMiddleware";

export interface ZirconiumRuntimeErrorMessage {
	type: ZirconNetworkMessageType.ZirconiumRuntimeError;
	message: string;
	time: number;
	debug?: ZirconDebugInformation;
	script?: string;
	source?: readonly [number, number];
	code: ZrRuntimeErrorCode;
}

export interface ZirconDebugInformation {
	LineAndColumn: readonly [number, number];
	CodeLine: readonly [number, number];
	TokenPosition: readonly [number, number];
	TokenLinePosition: readonly [number, number];
	Line: string;
}

export const enum ZirconNetworkMessageType {
	ZirconiumParserError = "ZrParserError",
	ZirconiumRuntimeError = "ZrRuntimeError",
	ZirconiumOutput = "ZrStandardOutput",
	ZirconStandardOutputMessage = "ZirconStandardOutput",
	ZirconStandardErrorMessage = "ZirconStandardError",
}

export interface ZirconiumParserErrorMessage {
	type: ZirconNetworkMessageType.ZirconiumParserError;
	message: string;
	time: number;
	script?: string;
	debug?: ZirconDebugInformation;
	source?: readonly [number, number];
	code: ZrParserErrorCode;
}

export interface ZirconExecutionOutput {
	type: ZirconNetworkMessageType.ZirconiumOutput;
	time: number;
	script?: string;
	message: string;
}

export interface ZirconLogOutput {
	type: ZirconNetworkMessageType.ZirconStandardOutputMessage;
	time: number;
	tag: string;
	level: ZirconLogLevel.Debug | ZirconLogLevel.Info | ZirconLogLevel.Warning;
	message: string;
}

export interface ZirconLogErrorOutput {
	type: ZirconNetworkMessageType.ZirconStandardErrorMessage;
	time: number;
	tag: string;
	level: ZirconLogLevel.Error | ZirconLogLevel.Wtf;
	message: string;
}

export type ZirconStandardOutput = ZirconExecutionOutput | ZirconLogOutput;
export type ZirconErrorOutput = ZirconiumRuntimeErrorMessage | ZirconiumParserErrorMessage | ZirconLogErrorOutput;

const Remotes = Net.Definitions.Create({
	[RemoteId.StandardOutput]: Net.Definitions.Event<[], [output: ZirconStandardOutput]>(),
	[RemoteId.StandardError]: Net.Definitions.Event<[], [output: ZirconErrorOutput]>(),
	[RemoteId.DispatchToServer]: Net.Definitions.Event<[message: string]>([
		Net.Middleware.RateLimit({ MaxRequestsPerMinute: 25 }),
		Net.Middleware.TypeChecking((value: unknown): value is string => typeIs(value, "string")),
	]),
	[RemoteId.GetPlayerOptions]: Net.Definitions.AsyncFunction<() => defined>(),
	[RemoteId.GetServerLogMessages]: Net.Definitions.AsyncFunction<
		() => Array<ZirconStandardOutput | ZirconErrorOutput>
	>([createPermissionMiddleware("CanRecieveServerLogMessages")]),
});
export default Remotes;