import { randomUUID } from "crypto"
import * as csv from "csv"
import { createReadStream, createWriteStream } from "fs"
import path from "path"

export class CSV {
    async writeCsv(data: Object[], columns: string[], csvName: string = `${randomUUID()}`) {
        const dir = path.resolve()
        const stream = createWriteStream(path.resolve(dir, `./.tmp/${csvName}.csv`))
        const stringifer = csv.stringify({ header: true, columns })
        data.forEach(e => {
            stringifer.write(e)
        })
        stringifer.pipe(stream)
        stringifer.end()
        return csvName;
    }

    readCSV(fileName: string, extractFromArrayIfOneElement?: boolean): Promise<any[]> {
        const dir = path.resolve()
        let output: any[] = [];
        const parser = csv.parse({ delimiter: ",", from_line: 2 })
        return new Promise((resolve, reject) => {
            createReadStream(path.resolve(dir, `./.tmp/${fileName}.csv`))
                .pipe(parser)
                .on('data', (data) => {
                    parser.pause();
                    c(data, output, (err: Error) => {
                        if (err) reject(err)
                        parser.resume()
                    })
                })
                .on('end', () => {
                    resolve(output) // extraction/return point of the desired data
                })

            const c = (data: any, out: any[], callback: CallableFunction) => {
                out.push(extractFromArrayIfOneElement === true ? Array.isArray(data) ? data.length > 1 ? data : data[0] : data : data)
                callback()
            }
        })
    }
}