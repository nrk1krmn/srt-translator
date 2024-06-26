import fs from 'fs';
///
import Utilities from './src/utilities.js';
import Translator from './src/translator.js'
///
const Utils = new Utilities();

let path = await Utils.getDirectoryPath();
let pathFiles = await Utils.getFilesNameFromDirectory(path);

if (pathFiles.length && Utils.checkSrtFilesInDirectory(pathFiles)) {
    for (const pathFile of pathFiles) {
        if (pathFile.match(/(.+)\.srt/gm)) {
            const filePath = path.trim() + "/" + pathFile.trim();
            const file = Utils.getFileString(filePath);
            if (file.length) {
                const result = await Utils.translateTextFromSrtString(file, 'en', 'ru');
                if (result) {
                    fs.writeFileSync(filePath, Buffer(result));
                } else {
                    process.stdout.write(`\x1B[36m${pathFile}\x1B[0m is empty or broken`);
                }
            } else {
                process.stdout.write(`\x1B[36m${pathFile}\x1B[0m is empty or broken`);
            }
        } else {
            continue;
        }
    }
} else {
    process.stdout.write('')
}

