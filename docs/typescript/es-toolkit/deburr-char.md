---
title: "アクセント記号を Unicode の正規化で引きはがす"
description: "é を e に、ß を ss にするような変換の 1 文字分の処理。Unicode の NFD 正規化で文字と記号を分け、記号だけを捨てている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/deburr.ts
lines: [70, 104]
function: "deburrChar"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 最適化]
---

## ひとことで

`deburr` は `'déjà vu'` を `'deja vu'` のように、**アクセント記号などを取り除いて基本のラテン文字にする** 関数です。検索で「cafe」と入力しても「café」が見つかるようにする、といった用途に使います。

`deburrChar` はその 1 文字ぶんの処理で、**Unicode の正規化** という仕組みを使って、文字と記号を分解してから記号だけを捨てます。

## コード

::: code-group

```ts:line-numbers=70 [日本語訳]
function deburrChar(char: string): string {
  const code = char.charCodeAt(0);

  if (code < 0x80) {
    return char;
  }

  if (isCombiningMark(code)) {
    return '';
  }

  const deburred = deburrMap.get(char);

  if (deburred != null) {
    return deburred;
  }

  // // 分解してラテン文字の記号になるのは、Latin-1 Supplement、
  // // Latin Extended-A、Latin Extended-B、Latin Extended Additional のブロックと、ケルビン記号・オングストローム記号だけ。
  // // ハングルやキリル文字などのそれ以外の文字は、そのまま残す。
  if (!isLatinLetter(code)) {
    return char;
  }

  const decomposed = char.normalize('NFD');
  let result = '';

  for (let index = 0; index < decomposed.length; index++) {
    if (!isCombiningMark(decomposed.charCodeAt(index))) {
      result += deburrMap.get(decomposed[index]) ?? decomposed[index];
    }
  }

  return result;
}
```

```ts:line-numbers=70 [原文]
function deburrChar(char: string): string {
  const code = char.charCodeAt(0);

  if (code < 0x80) {
    return char;
  }

  if (isCombiningMark(code)) {
    return '';
  }

  const deburred = deburrMap.get(char);

  if (deburred != null) {
    return deburred;
  }

  // Only Latin letters with diacritical marks are decomposed. They live in the Latin-1 Supplement,
  // Latin Extended-A, Latin Extended-B, and Latin Extended Additional blocks, and the Kelvin and Angstrom signs.
  // Other letters, such as Hangul syllables or Cyrillic letters, are kept as they are.
  if (!isLatinLetter(code)) {
    return char;
  }

  const decomposed = char.normalize('NFD');
  let result = '';

  for (let index = 0; index < decomposed.length; index++) {
    if (!isCombiningMark(decomposed.charCodeAt(index))) {
      result += deburrMap.get(decomposed[index]) ?? decomposed[index];
    }
  }

  return result;
}
```

:::

`deburrMap` はファイルの先頭にある対応表で、`ß → ss`、`Æ → Ae`、`ø → o` のように「分解しても記号にならない」特殊な文字の置き換え先を持っています。

## 前提知識

- **文字コード**: `char.charCodeAt(0)` は文字の番号（コードポイント）を返します。`0x80` 未満は英数字や記号などの ASCII 文字です。
- **結合文字**: Unicode では `é` を「`e` + 上に付く記号（U+0301）」の 2 つで表すこともできます。後ろの記号は前の文字にくっついて表示されるので「結合文字」と呼ばれます。
- **`normalize('NFD')`**: 文字列を「分解した形」にそろえるメソッドです。`'é'.normalize('NFD')` は `'e'` と結合文字の 2 文字になります。
- **`Map#get`**: 対応表から値を引きます。なければ `undefined` です。
- **`??`**: 左が `null` か `undefined` のときだけ右を使います。

## 何をしているか

### 1. ASCII はそのまま

```ts:line-numbers=73
  if (code < 0x80) {
    return char;
  }
```
`a` や `1` は変換不要なので、すぐに返します。文章の大半はここで終わります。

### 2. 単独の結合文字は捨てる

```ts:line-numbers=77
  if (isCombiningMark(code)) {
    return '';
  }
```
入力がすでに分解された形なら、記号だけが単独で来ることがあります。

### 3. 特殊な文字は対応表で

```ts:line-numbers=81
  const deburred = deburrMap.get(char);

  if (deburred != null) {
    return deburred;
  }
```
`ß` や `ø` は分解しても記号が出てこない「それ自体が別の文字」なので、表で置き換えます。

### 4. ラテン文字以外はそのまま

```ts:line-numbers=90
  if (!isLatinLetter(code)) {
    return char;
  }
```
ハングルやキリル文字は分解するとまったく別の形になってしまうので、触りません。

```ts:line-numbers=87
  // Only Latin letters with diacritical marks are decomposed. They live in the Latin-1 Supplement,
  // Latin Extended-A, Latin Extended-B, and Latin Extended Additional blocks, and the Kelvin and Angstrom signs.
  // Other letters, such as Hangul syllables or Cyrillic letters, are kept as they are.
```


### 5. 分解して記号を捨てる

```ts:line-numbers=94
  const decomposed = char.normalize('NFD');
  let result = '';

  for (let index = 0; index < decomposed.length; index++) {
    if (!isCombiningMark(decomposed.charCodeAt(index))) {
      result += deburrMap.get(decomposed[index]) ?? decomposed[index];
    }
  }

  return result;
```
```
'é' → NFD → 'e' + U+0301 → 結合文字を捨てて 'e'
'Ǻ' → NFD → 'A' + U+030A + U+0301 → 'A'
```

## ここがすごい

- **アクセント付き文字を 1 つずつ列挙しない**: `é → e`、`è → e`、`ê → e`…と表に書いていくと数百行になり、漏れも出ます。Unicode の分解の情報に任せれば、表に書くのは分解できない少数の文字だけで済みます。
- **速い道を先に**: ASCII の判定は数値の比較 1 回です。正規化は比較的重い処理なので、本当に必要な文字だけに使うよう、軽いチェックを前に並べています。
- **やりすぎない**: ラテン文字の範囲だけを対象にすることで、韓国語の「한」が子音と母音のパーツに分解されて読めなくなる、といった事故を防いでいます。コメントでその理由を明記しているのも親切です。

## まとめ

- アクセント除去は「NFD で分解 → 結合文字を捨てる」が基本。
- 分解できない特殊文字だけを対応表で補う。
- 軽い判定を先に並べて、重い処理を必要なときだけ行う。
