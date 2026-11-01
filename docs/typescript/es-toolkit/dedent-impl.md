---
title: "いちばん浅い字下げを探して全行から削る"
description: "複数行の文字列から共通の字下げを取り除く処理の本体。空行を無視して最小の字下げを探し、Infinity を「まだ見つかっていない」の印に使う。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/dedent.ts
lines: [125, 169]
function: "dedentImpl"
difficulty: 1
format: 2
tags: [文字列処理, アルゴリズム, イディオム]
---

## ひとことで

`dedentImpl(text)` は、複数行の文字列から **すべての行に共通する先頭の空白** を取り除きます。`dedent` 関数の中心部分です。

```
入力:
    if (x) {
      run()
    }
出力:
if (x) {
  run()
}
```

アルゴリズムは「空行以外でいちばん浅い字下げを探し、その分だけ全行から削る」という素直なものですが、改行コードや空行の扱いなど、実用上の細かい点がきちんと押さえられています。

## コード

```ts:line-numbers=125
function dedentImpl(text: string): string {
  text = text.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  if (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }

  if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  let commonIndent = Infinity;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      continue;
    }

    let indent = 0;
    while (indent < line.length && (line[indent] === ' ' || line[indent] === '\t')) {
      indent++;
    }

    if (indent < commonIndent) {
      commonIndent = indent;
    }
  }

  if (commonIndent === Infinity) {
    return '';
  }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      lines[i] = '';
    } else {
      lines[i] = lines[i].slice(commonIndent);
    }
  }

  return lines.join('\n');
}
```

## 前提知識

- **`replace(/\r\n/g, '\n')`**: Windows の改行（`\r\n`）を、Unix 系の改行（`\n`）にそろえます。`g` はすべて置き換える指定です。
- **`split('\n')` / `join('\n')`**: 行ごとに分けて配列にする／配列を改行でつなぎ直す。
- **`trim()`**: 前後の空白を取り除いた文字列を返します。`line.trim() === ''` で「空白しかない行」を判定しています。
- **`shift()` / `pop()`**: 配列の先頭／末尾の要素を取り除きます。
- **`Infinity`**: 無限大。どんな数よりも大きいので、「最小値を探す」ときの初期値に便利です。
- **`slice(n)`**: 文字列の `n` 文字目以降を返します。

## 何をしているか

### 1. 改行をそろえ、前後の空行を落とす

```ts:line-numbers=126
  text = text.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  if (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }

  if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
```
テンプレート文字列は `` dedent` `` の直後と閉じの直前に改行が入るのが普通なので、最初と最後の空行を 1 つずつ取り除きます。

### 2. いちばん浅い字下げを探す

```ts:line-numbers=137
  let commonIndent = Infinity;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      continue;
    }

    let indent = 0;
    while (indent < line.length && (line[indent] === ' ' || line[indent] === '\t')) {
      indent++;
    }

    if (indent < commonIndent) {
      commonIndent = indent;
    }
  }
```
空白だけの行は飛ばし、各行の先頭のスペースとタブを数えます。その最小値を `commonIndent` に記録します。

```ts:line-numbers=142
    if (line.trim() === '') {
      continue;
    }
```

```ts:line-numbers=146
    let indent = 0;
    while (indent < line.length && (line[indent] === ' ' || line[indent] === '\t')) {
      indent++;
    }
```


```
'    if (x) {'  → 4
'      run()'   → 6
'    }'         → 4
→ commonIndent = 4
```

### 3. 中身のある行がなければ空文字

```ts:line-numbers=156
  if (commonIndent === Infinity) {
    return '';
  }
```
すべてが空行だと `commonIndent` は `Infinity` のままなので、それを目印に空文字を返します。

### 4. 削ってつなぐ

```ts:line-numbers=160
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      lines[i] = '';
    } else {
      lines[i] = lines[i].slice(commonIndent);
    }
  }

  return lines.join('\n');
```
空白だけの行は空にし、それ以外は先頭から `commonIndent` 文字を削ります。

## ここがすごい

- **空行を計算から外す**: エディタによっては空行の空白が消えていたり、逆に余計に残っていたりします。空行も数えてしまうと、共通インデントが 0 になって何も削れなくなります。空行は無視して、出力では空にそろえるのが実用的な判断です。
- **`Infinity` を初期値と「見つからなかった」の印に兼用**: 最小値探しの初期値を `Infinity` にすると、最初の行の値で必ず上書きされます。そして最後まで `Infinity` なら「対象の行が 1 つもなかった」とわかります。別の旗を用意せずに済みます。
- **改行コードを最初にそろえる**: `\r\n` のまま `split('\n')` すると、各行の末尾に `\r` が残ります。入口で 1 回そろえておけば、以降の処理は 1 種類の改行だけを考えればよくなります。
- **字下げの文字を限定**: スペースとタブだけを数えるので、全角スペースなどの意図しない文字を削ることはありません。

## まとめ

- 共通インデントの除去は「空行以外の最小の字下げを全行から削る」。
- 最小値探しの初期値に `Infinity` を使うと、「何もなかった」の判定も兼ねられる。
- 改行コードのような表記ゆれは、入口で 1 回そろえておくと後が楽。
