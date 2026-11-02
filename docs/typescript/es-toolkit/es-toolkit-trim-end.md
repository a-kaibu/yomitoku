---
title: "末尾の空白や指定の文字だけを、取り除いて切る"
description: "es-toolkit の trimEnd。引数がなければ組み込みの trimEnd を使う。文字を指定すると、末尾から 1 文字ずつ調べて、その文字を削る。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/trimEnd.ts
lines: [17, 43]
function: "trimEnd"
difficulty: 3
format: 2
tags: [文字列処理, 防御的プログラミング, イディオム]
---

## ひとことで

`trimEnd(str, chars?)` は、文字列の末尾から、空白や指定した文字を取り除く関数です。`chars` を省略すると、組み込みの `trimEnd` と同じく空白を取り除きます。`chars` に文字や文字の配列を渡すと、その文字だけを末尾から削ります。

```ts
trimEnd('abc   ')            // 'abc'
trimEnd('hello!!!', '!')     // 'hello'
trimEnd('file.txt...', ['.', 't', 'x'])  // 'file'（配列に含まれる文字を末尾から削る）
```

## コード

```ts:line-numbers=17
export function trimEnd(str: string, chars?: string | string[]): string {
  if (chars === undefined) {
    return str.trimEnd();
  }

  let endIndex = str.length;

  switch (typeof chars) {
    case 'string': {
      if (chars.length !== 1) {
        throw new Error(`The 'chars' parameter should be a single character string.`);
      }

      while (endIndex > 0 && str[endIndex - 1] === chars) {
        endIndex--;
      }
      break;
    }
    case 'object': {
      while (endIndex > 0 && chars.includes(str[endIndex - 1])) {
        endIndex--;
      }
    }
  }

  return str.substring(0, endIndex);
}
```

## 前提知識

- **`trimEnd()`**: 組み込みの文字列メソッドです。末尾の空白（スペース、改行、タブなど）を取り除きます。
- **`substring(0, 位置)`**: 文字列の先頭から、指定した位置の手前までを取り出します。
- **`switch` 文**: 値の種類によって処理を分ける文です。`case` の後に続く処理を実行し、`break` で抜けます。
- **`typeof chars`**: 引数が文字列か、配列（`'object'`）かで処理を変えるために使われます。
- **`includes`**: 配列に値が含まれるかを判定するメソッドです。

## 何をしているか

### 1. 指定がなければ組み込みに任せる

```ts:line-numbers=18
  if (chars === undefined) {
    return str.trimEnd();
  }
```

`chars` が無いときは、組み込みの `trimEnd` を呼ぶだけです。最も速く、確実な方法です。

### 2. 文字列の指定なら、1 文字ずつ削る

```ts:line-numbers=22
  let endIndex = str.length;

  switch (typeof chars) {
    case 'string': {
      if (chars.length !== 1) {
        throw new Error(`The 'chars' parameter should be a single character string.`);
      }

      while (endIndex > 0 && str[endIndex - 1] === chars) {
        endIndex--;
      }
      break;
    }
```

最初に終わりの位置を、文字列の長さにしておきます。`chars` が 1 文字の文字列なら、末尾がその文字である間、位置を 1 つずつ戻します。1 文字でなければエラーです。

### 3. 配列の指定なら、含まれる文字を削る

```ts:line-numbers=35
    case 'object': {
      while (endIndex > 0 && chars.includes(str[endIndex - 1])) {
        endIndex--;
      }
    }
```

配列の場合は、末尾の文字が配列に `includes` されている間、位置を戻します。

### 4. 残った先頭側を返す

```ts:line-numbers=42
  return str.substring(0, endIndex);
```

位置より前の部分を `substring` で取り出して返します。

## ここがすごい

- **早道と汎用の 2 段構え**: 空白だけなら組み込みを使い、指定があるときだけ独自の処理を走らせます。普段の速さを落とさずに、柔軟さを持たせています。
- **末尾から見る**: 後ろから 1 文字ずつ見て、残す部分の終わりを決めます。文字列を作り直さずに、位置だけを動かすので、効率的です。
- **入力の検査**: 文字列の指定が 1 文字でないときは、分かりやすいエラーを投げます。曖昧な指定で誤動作しないようにしています。
- **位置の計算だけで完結**: 最後に 1 回だけ `substring` するので、途中で何度も文字列を作りません。

## まとめ

- 末尾の削除は、後ろから位置を戻して、残す部分の終わりを決めると効率的。
- 既定の動作は組み込みに任せ、特別な指定があるときだけ独自に処理する。
- 1 文字だけという前提は、検査してエラーにすると、誤用を早く見つけられる。
- 文字列の作り直しを避けると、長い文字列でも速く処理できる。
