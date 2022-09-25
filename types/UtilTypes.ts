export type ObjectifiedArray<arr extends Array<any>> = {
	[entry in keyof arr as string]: arr[entry]
}