import fs from 'fs';
import { yandexTranslate } from './translator.js';

export const log = {

    cyan: (text) => {
        return `\x1B[36m${text}\x1B[0m`
    },

    red: (text) => {
        return `\x1B[31m${text}\x1B[0m`
    }
};

export const utils = {

    argvScene: (argv) => {
        if (argv.length === 2) {
            return false;
        }
        const argList = {
            '--help': '',
            '-h': '',
            '--path': '',
            '-p': '',
            '--lang': '',
            '-l': ''
        };
        const args = [];
        for (const arg of argv) {
            if (arg in argList) {
                args.push(arg);
            };
        };
        if (args) {
            return args;
        } else {
            return false;
        }
    },

    getDataFromArgs: (argv) => {
        const data = {
            path: false,
            langFrom: false,
            langTo: false
        }
        for (let i = 0; i < argv.length; i++) {
            if (argv[i] == '--path' || argv[i] == '-p') {
                const argContent = argv[i + 1];
                if (argContent.match(/^(\/?[^\/]+\/?)+$/)) {
                    data.path = argContent;
                } else {
                    console.log(`${log.cyan(argContent)}${log.red('This is not a directory!')} Try again\n`);
                    return false;
                }
            } else if (argv[i] == '--lang' || argv[i] == '-l') {
                const argContent = argv[i + 1];
                if (argContent.match(/^(\w\w),(\w\w)$/m)) {
                    data.langFrom = argContent.split(',')[0].trim().toLowerCase();
                    data.langTo = argContent.split(',')[1].trim().toLowerCase();
                } else {
                    console.log(`${log.red('Incorrect language codes!')} Try again\n`);
                    return false;
                }
            }
        }

        if (data.path && data.langFrom && data.langTo) {
            return data;
        } else {
            return false;
        }
    },

    printHelp: () => {
        const langList =
            'Chinese: zh, English: en, Japanese: ja\n\t\t\tKorean: ko, French: fr, Spanish: es\n\t\t\tRussian: ru, German: de, Italian: it\n\t\t\tTurkish: tr, Portugese: pt, Vietnamese: vi\n\t\t\tIndonesian: id, Thai: th, Malay: ms\n\t\t\tArabic: ar, Hindi: hi, Norwegian: no\n\t\t\tPersian: fa'
        console.log(`Options:\n\t-h, --help\tGet help\n\n\t-p, --path\tSpecify the directory with the .srt files\n\t\t\tExample: --path /home/username/srt_files\n\n\t-p, --path\tSpecify the languages (format: lang1,lang2)\n\t\t\tExample: --lang en,ru\n\n\tLanguages\t${langList}`)
    },

    getDirectoryPath: () => {
        return new Promise((resolve, reject) => {
            const askForInput = () => {
                console.log('Specify the path to the directory with the \x1B[36m.srt\x1B[0m files that you want to translate below:\n');
                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                process.stdin.once('data', (inp) => {
                    inp = inp.trim();
                    if (inp.match(/^(\/?[^\/]+\/?)+$/)) {
                        process.stdin.pause();
                        process.stdin.removeAllListeners();
                        resolve(inp);
                    } else {
                        console.log(`${log.red('This is not a directory!')} Try again\n`);
                        askForInput();
                    }
                });
                process.stdin.on('error', (err) => {
                    reject(err);
                });
            };
            askForInput();
        });
    },

    getTranslateLanguages: () => {
        return new Promise((resolve, reject) => {
            const askForInput = () => {
                console.log('\nSeparated by commas, specify two language codes: the first one from which you want to translate, the second one to which you want to translate (example: en, ru):\n');
                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                process.stdin.once('data', (inp) => {
                    inp = inp.trim();
                    if (inp.match(/^(\w\w), (\w\w)$/m) || inp.match(/^(\w\w),(\w\w)$/m)) {
                        const languages = {
                            from: inp.split(',')[0].trim().toLowerCase(),
                            to: inp.split(',')[1].trim().toLowerCase()
                        }
                        process.stdin.destroy();
                        process.stdin.removeAllListeners();
                        resolve(languages);
                    } else {
                        console.log(`${log.red('Incorrect language codes!')} Try again\n`);
                        askForInput();
                    }
                });
                process.stdin.on('error', (err) => {
                    reject(err);
                });
            };
            askForInput();
        });
    },

    getFilesNameFromDirectory: (path) => {
        return new Promise((resolve, reject) => {
            if (path) {
                const dir = fs.readdir(path.trim(), (err, files) => {
                    if (err && err.code == 'ENOENT') {
                        console.log(`${log.red('Such a directory was not found!')} Try again\n`);
                        return false;
                    } else if (err) {
                        console.error(err);
                        return false;
                    } else {
                        resolve(files);
                    }
                })
            } else {
                return false;
            }
        });
    },

    checkSrtFilesInDirectory: (arr) => {
        for (const file of arr) {
            if (file.match(/(.+)\.srt/gm)) {
                return true;
            }
        }
        return false;
    },

    getFileString: (path) => {
        const data = fs.readFileSync(path);
        return data.toString();
    },

    getDistributionLinesCount: (totalLinesCount) => {
        if (totalLinesCount < 50) {
            return 1;
        }
        let count = 0;
        for (let i = totalLinesCount; i > 0; i -= 50) {
            count += 1.7;
        }
        return Math.ceil(count);
    },

    translateTextFromSrtString: async (srtString, inputLang, outputLang) => {
        srtString = srtString.trim();
        const lines = srtString.split(/\r\n/); // разбиваю текст на строки

        const fullText = [];

        // тут прохожу по каждой строке и чекаю по регуляркам на какой именно строке нахожусь
        for (const line in lines) {
            if (!lines[line].match(/^\d+$/)) {
                const timestampMatch = lines[line].match(/^(\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3})$/);
                if (!timestampMatch && lines[line].length) {
                    const fixed = lines[line].replace('node', '"Node"').trim();
                    fullText.push(fixed); // кидаю текстовое содержимое в массив
                }
            }
        }

        const originalTextLines = fullText.length; // тут количество srt-шных блоков

        // ниже создаю массив в котором лежат строки по 20 предложений в каждой
        const sentences = fullText.join(" ").split(".");
        const result = [];
        for (let i = 0; i < sentences.length; i += 20) {
            result.push(sentences.slice(i, i + 20).join(". "));
        }

        // далее перевожу эти строки и пихаю в переменную
        let translatedText;
        for (const paragraph of result) {
            const translatedParagraph = await yandexTranslate(paragraph, inputLang, outputLang);
            translatedText += `${translatedParagraph} `
        }

        // делю весь перевод на слова, равномерно распределяю по рядам
        const translatedWords = translatedText.split(' ');
        const rows = [];
        const wordsPerRow = Math.floor(translatedWords.length / originalTextLines);
        const remainingWords = translatedWords.length % originalTextLines;

        const distributionLinesCount = utils.getDistributionLinesCount(originalTextLines);

        for (let i = 0; i < originalTextLines - distributionLinesCount; i++) {
            rows.push(translatedWords.slice(i * wordsPerRow, (i + 1) * wordsPerRow));
        }

        const remainingWordsIndex = originalTextLines - distributionLinesCount;
        const remainingWordsCount = translatedWords.length - remainingWordsIndex * wordsPerRow;
        for (let i = 0; i < distributionLinesCount; i++) {
            const startIndex = remainingWordsIndex * wordsPerRow + i * Math.ceil(remainingWordsCount / distributionLinesCount);
            const endIndex = remainingWordsIndex * wordsPerRow + (i + 1) * Math.ceil(remainingWordsCount / distributionLinesCount);
            rows.push(translatedWords.slice(startIndex, endIndex));
        }

        // объединяю массивы строк в предложения внутри рядов
        for (const row in rows) {
            const line = rows[row].join(' ');
            rows[row] = line;
        }

        // заменяю текст в srt блоках на переведенный
        let counter = 0;
        for (const line in lines) {
            if (!lines[line].match(/^\d+$/)) {
                const timestampMatch = lines[line].match(/^(\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3})$/);
                if (!timestampMatch && lines[line].length) {
                    lines[line] = rows[counter];
                    counter++;
                }
            }
        }
        return lines.join('\r\n');
    }
}
