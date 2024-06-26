import fs from 'fs';
///
import Utilities from './src/utilities.js';
///
const Utils = new Utilities();

const args = Utils.argvScene(process.argv)
if (!args) {
    console.log('You did not specify arguments or specified non-existent ones. Use --help');
} else if (args.includes('--help') || args.includes('-h')) {
    Utils.printHelp();
} else if ((args.includes('--path') || args.includes('-p')) && (args.includes('--lang') || args.includes('-l'))) {
    const argsData = Utils.getDataFromArgs(process.argv);
    if (argsData) {
        const pathFiles = await Utils.getFilesNameFromDirectory(argsData.path);
        if (pathFiles.length && Utils.checkSrtFilesInDirectory(pathFiles)) {
            for (const pathFile of pathFiles) {
                if (pathFile.match(/(.+)\.srt/gm)) {
                    const filePath = argsData.path.trim() + "/" + pathFile.trim();
                    const file = Utils.getFileString(filePath);
                    if (file.length) {
                        const result = await Utils.translateTextFromSrtString(file, argsData.langFrom, argsData.langTo);
                        if (result) {
                            fs.writeFileSync(filePath, Buffer(result));
                        } else {
                            console.log(`\x1B[36m${pathFile}\x1B[0m is empty or broken`);
                        }
                    } else {
                        console.log(`\x1B[36m${pathFile}\x1B[0m is empty or broken`);
                    }
                } else {
                    continue;
                }
            }
        }
    }
} else {
    console.log('You must use the --path and --lang arguments');
}

