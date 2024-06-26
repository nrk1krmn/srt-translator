import fs from 'fs';
///
import { utils, log } from './src/utilities.js';
///

(async () => {
    const args = utils.argvScene(process.argv);
    const start = Date.now();

    if (!args) {
        console.log('You did not specify arguments or specified non-existent ones. Use --help');
        return;
    }

    if (args.includes('--help') || args.includes('-h')) {
        utils.printHelp();
        return;
    }

    if (!(args.includes('--path') || args.includes('-p')) || !(args.includes('--lang') || args.includes('-l'))) {
        console.log('You must use the --path and --lang arguments');
        return;
    }

    const argsData = utils.getDataFromArgs(process.argv);
    if (!argsData) {
        return;
    }

    const pathFiles = await utils.getFilesNameFromDirectory(argsData.path);
    if (!pathFiles.length || !utils.checkSrtFilesInDirectory(pathFiles)) {
        return;
    }

    console.log('');
    let writtenFilesCount = 0;
    for (const pathFile of pathFiles) {
        if (!pathFile.match(/(.+)\.srt/gm)) {
            continue;
        }

        const filePath = `${argsData.path.trim()}/${pathFile.trim()}`;
        const file = utils.getFileString(filePath);

        if (!file.length) {
            console.log(`${log.cyan(pathFile)} is empty or broken`);
            continue;
        }

        const result = await utils.translateTextFromSrtString(file, argsData.langFrom, argsData.langTo);
        if (!result) {
            console.log(`${log.cyan(pathFile)} is empty or broken`);
            continue;
        }

        try {
            fs.writeFileSync(filePath, result);
            console.log(`${log.cyan(pathFile)} successfully written!`);
            writtenFilesCount++;
        } catch (error) {
            console.log(error);
            continue;
        }
    }

    const end = (Date.now() - start) / 1000;
    console.log(`\n${log.cyan("Success!")}\nTranslated files: ${writtenFilesCount}\nTime spent: ${end.toFixed(2)} secs.`);
})();