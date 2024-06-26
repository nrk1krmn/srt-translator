import { randomUUID } from 'node:crypto';

export async function yandexTranslate(text, inputLang, outputLang) {
    const url = 'https://translate.yandex.net/api/v1/tr.json/translate';
    const query = new URLSearchParams({
        id: randomUUID().replaceAll('-', '') + '-0-0',
        srv: 'android',
    });

    const res = await fetch(`${url}?${query}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            source_lang: inputLang,
            target_lang: outputLang,
            text
        }),
    });

    if (res.ok) {
        const result = await res.json();
        if (result.text) {
            return result.text[0];
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${await res.text()}`;
    }
}

export default { yandexTranslate }