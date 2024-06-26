import fs from 'fs';
import Translator, { yandexTranslate } from './translator.js';

class Utilities {
    constructor() {
    }

    getDirectoryPath() {
        return new Promise((resolve, reject) => {
            process.stdout.write('Specify the path to the directory with the \x1B[36m.srt\x1B[0m files that you want to translate below:\n');
            process.stdin.resume();
            process.stdin.setEncoding('utf8');

            process.stdin.on('data', (inp) => {
                if (inp.match(/\.\/(.+)/gm) || inp.match(/\/(.+)/gm)) {
                    process.stdin.destroy();
                    resolve(inp);
                } else {
                    process.stdout.write('\x1B[31mThis is not a directory!\x1B[0m Try again\n');
                    this.getDirectoryPath().then(resolve);
                }
            });
        });
    };

    // getLanguages() {
    //     return new Promise((resolve, reject) => {
    //         process.stdout.write('Specify the path to the directory with the \x1B[36m.srt\x1B[0m files that you want to translate below:\n');
    //         process.stdin.resume();
    //         process.stdin.setEncoding('utf8');

    //         process.stdin.on('data', (inp) => {
    //             if (inp.match(/\.\/(.+)/gm) || inp.match(/\/(.+)/gm)) {
    //                 process.stdin.destroy();
    //                 resolve(inp);
    //             } else {
    //                 process.stdout.write('\x1B[31mThis is not a directory!\x1B[0m Try again\n');
    //                 this.getDirectoryPath().then(resolve);
    //             }
    //         });
    //     });
    // };

    getFilesNameFromDirectory(path) {
        return new Promise((resolve, reject) => {
            if (path) {
                const dir = fs.readdir(path.trim(), (err, files) => {
                    if (err && err.code == 'ENOENT') {
                        process.stdout.write('\x1B[31mSuch a directory was not found!\x1B[0m\n');
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
    };

    checkSrtFilesInDirectory(arr) {
        for (const file of arr) {
            if (file.match(/(.+)\.srt/gm)) {
                return true;
            }
        }
        return false;
    };

    getFileString(path) {
        const data = fs.readFileSync(path);
        return data.toString();
    };

    getDistributionLinesCount(totalLinesCount) {
        if (totalLinesCount < 50) {
            return 1;
        }
        let count = 0;
        for (let i = totalLinesCount; i > 0; i -= 50) {
            count += 1.7;
        }
        return Math.ceil(count);
    }

    async translateTextFromSrtString(srtString, inputLang, outputLang) {
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
        // if (originalTextLines > ) {
        //     const translatedWords = translatedText.split(' ');
        //     const rows = [];
        //     const wordsPerRow = Math.floor(translatedWords.length / originalTextLines);
        //     const remainingWords = translatedWords.length % originalTextLines;

        //     for (let i = 0; i < originalTextLines - 3; i++) {
        //         rows.push(translatedWords.slice(i * wordsPerRow, (i + 1) * wordsPerRow));
        //     }

        //     const remainingRows = translatedWords.slice((originalTextLines - 3) * wordsPerRow);
        //     for (let i = 0; i < 3; i++) {
        //         rows.push(remainingRows.slice(i * remainingWords, (i + 1) * remainingWords));
        //     }
        // }
        const translatedWords = translatedText.split(' ');
        const rows = [];
        const wordsPerRow = Math.floor(translatedWords.length / originalTextLines);
        const remainingWords = translatedWords.length % originalTextLines;

        const distributionLinesCount = this.getDistributionLinesCount(originalTextLines);

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

export default Utilities;