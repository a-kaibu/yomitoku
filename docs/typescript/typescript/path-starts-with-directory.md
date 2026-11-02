---
title: "パスがフォルダの中にあるかを、区切りの文字を含めて確かめる"
description: "TypeScript コンパイラの startsWithDirectory。ファイル名がフォルダ名で始まるかを調べるとき、末尾に / と \ を付けて比べ、「src2」のような似た名前を除く。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [1002, 1006]
function: "startsWithDirectory"
difficulty: 2
format: 2
tags: [ファイル, 文字列処理, 防御的プログラミング]
---

## ひとことで

`startsWithDirectory(fileName, directoryName, getCanonicalFileName)` は、ファイルのパスがフォルダのパスの中にあるかを判定する関数です。たとえば `src/a.ts` は `src` の中にありますが、`src2/a.ts` は `src` の中ではありません。文字列として前が一致しているかだけでなく、区切りの位置も確かめます。

```ts
startsWithDirectory('src/a.ts', 'src', (s) => s)   // true
startsWithDirectory('src2/a.ts', 'src', (s) => s)  // false
```

## コード

```ts:line-numbers=1002
export function startsWithDirectory(fileName: string, directoryName: string, getCanonicalFileName: GetCanonicalFileName): boolean {
    const canonicalFileName = getCanonicalFileName(fileName);
    const canonicalDirectoryName = getCanonicalFileName(directoryName);
    return startsWith(canonicalFileName, canonicalDirectoryName + "/") || startsWith(canonicalFileName, canonicalDirectoryName + "\\");
}
```

## 前提知識

- **`getCanonicalFileName`**: 比べる前に、パスを正規の形（大文字小文字など）にする関数です。呼び出し側が決めて渡します。
- **`startsWith`**: 文字列が指定の文字列で始まるかを判定する、コンパイラの内部関数です。
- **`||`（または）**: どちらかが真なら真になります。ここでは、スラッシュとバックスラッシュの両方を区切りとして扱うために使われています。
- **文字列の前方一致の落とし穴**: `src` は `src2` の先頭と一致しますが、フォルダとしては別物です。区切りの文字を付けて比べることで、この誤りを防げます。

## 何をしているか

### 1. 両方のパスを正規の形にする

```ts:line-numbers=1003
    const canonicalFileName = getCanonicalFileName(fileName);
    const canonicalDirectoryName = getCanonicalFileName(directoryName);
```

ファイル名とフォルダ名を、`getCanonicalFileName` で正規の形にします。大文字小文字の違いなどを、ここで吸収します。

### 2. フォルダ名の後に区切りを付けて、前方一致を調べる

```ts:line-numbers=1005
    return startsWith(canonicalFileName, canonicalDirectoryName + "/") || startsWith(canonicalFileName, canonicalDirectoryName + "\\");
```

フォルダ名の後ろにスラッシュ、または、バックスラッシュを付けて、ファイル名がそれで始まるかを調べます。`src/` で始まるなら中にあり、`src2/` で始まるなら別のフォルダです。

## ここがすごい

- **区切りを付けて境界を守る**: 単に `src` で始まるかを見ると、`src2` も一致してしまいます。区切りを付けると、フォルダの境界で止まるので、正しい判定になります。
- **両方の区切りに対応**: Unix と Windows の両方のパス形式を、`||` で 1 つの式にまとめています。
- **比べ方を外から渡せる**: 大文字小文字の扱いを `getCanonicalFileName` に任せるので、同じ関数で、様々なファイルシステムに対応できます。
- **1 行の判定で明快**: フォルダの中にあるかという問いに、そのまま答える形です。

## まとめ

- 文字列の前方一致は、フォルダの境界を守らないと誤判定が起きる。
- フォルダ名の後に区切りを付けて比べると、似た名前を正しく除ける。
- 大文字小文字などの違いは、正規化の関数を外から渡して吸収する。
- 複数の区切りの形式は、`||` などでまとめて扱うと簡潔になる。
