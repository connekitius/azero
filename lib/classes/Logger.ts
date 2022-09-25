import ansiColors from "ansi-colors"

export class Logger {
    static logSuccess(...args: string[]) {
        const str = args.length > 1 ? args.join(' ') : args[0]
        console.log(`${ansiColors.gray(`${new Date().toISOString().trim()}`)} ${ansiColors.magenta('SUCCESS')} ${ansiColors.green(str)}`)
    }

    static logFail(...args: string[]) {
        const str = args.length > 1 ? args.join(' ') : args[0]
        console.log(`${ansiColors.gray(`${new Date().toISOString().trim()}`)} ${ansiColors.magenta('FAIL')} ${ansiColors.red(str)}`)
    }

    static logInfo(...args: string[]) {
        const str = args.length > 1 ? args.join(' ') : args[0]
        console.log(`${ansiColors.gray(`${new Date().toISOString().trim()}`)} ${ansiColors.magenta('INFO')} ${ansiColors.green(str)}`)
    }

    static logError(...args: string[]) {
        const str = args.length > 1 ? args.join(' ') : args[0]
        console.log(`${ansiColors.gray(`${new Date().toISOString().trim()}`)} ${ansiColors.magenta('ERROR')} ${ansiColors.red(str)}`)
    }

    static logWarn(...args: string[]) {
        const str = args.length > 1 ? args.join(' ') : args[0]
        console.log(`${ansiColors.gray(`${new Date().toISOString().trim()}`)} ${ansiColors.magenta('WARNING')} ${ansiColors.yellow(str)}`)
    }

    static logDebug(...args: string[]) {
        const str = args.length > 1 ? args.join(' ') : args[0]
        console.log(`${ansiColors.gray(`${new Date().toISOString().trim()}`)} ${ansiColors.magenta('DEBUG')} ${ansiColors.blue(str)}`)
    }

    static logDebugAny(...args: any[]) {
        console.log(`${ansiColors.gray(`${new Date().toISOString().trim()}`)} ${ansiColors.magenta('DEBUG')} ${args}`)
    }
}