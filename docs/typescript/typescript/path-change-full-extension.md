---
title: "宣言ファイルの拡張子 .d.ts を壊さずに、拡張子を付け替える"
description: "TypeScript コンパイラの changeFullExtension。.d.ts のような二重の拡張子を正しく認識し、まとめて付け替える。通常の拡張子は changeAnyExtension に任せる。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [870, 877]
function: "changeFullExtension"
difficulty: 3
format: 2
tags: [ファイル, 文字列処理, 型システム]
---

## ひとことで

`changeFullExtension(path, newExtension)` は、ファイルの拡張子を新しいものに付け替える関数です。ただし、`.d.ts` のような「宣言ファイル」の拡張子は、2 つの部分（`.d` と `.ts`）をまとめて扱います。`a.d.ts` を `.js` に変えると、`a.js` になります（`a.d.js` ではありません）。

```ts
changeFullExtension('src/a.d.ts', '.js')  // 'src/a.js'
changeFullExtension('src/a.ts', '.js')    // 'src/a.js'（通常の拡張子）
```

## コード

```ts:line-numbers=870
export function changeFullExtension(path: string, newExtension: string): string {
    const declarationExtension = getDeclarationFileExtension(path);
    if (declarationExtension) {
        return path.slice(0, path.length - declarationExtension.length) +
            (startsWith(newExtension, ".") ? newExtension : ("." + newExtension));
    }
    return changeAnyExtension(path, newExtension);
}
```

## 前提知識

- **宣言ファイル（`.d.ts`）**: 型の情報だけを書いたファイルです。`a.d.ts` のように、`.d` と `.ts` の 2 つを組み合わせた拡張子を持ちます。
- **`getDeclarationFileExtension`**: パスが宣言ファイルなら、その拡張子（`.d.ts` など）を返す、このファイルの別の関数です。宣言ファイルでなければ、空を返すと考えられます。
- **`slice(0, 位置)`**: 文字列の先頭から、指定位置までを取り出します。末尾の拡張子を除くのに使われています。
- **`changeAnyExtension`**: 通常の拡張子を付け替える関数です。この関数は、宣言ファイルの場合だけ別の処理をします。

## 何をしているか

### 1. 宣言ファイルの拡張子があるかを調べる

```ts:line-numbers=871
    const declarationExtension = getDeclarationFileExtension(path);
    if (declarationExtension) {
```

まず `getDeclarationFileExtension` で、パスが宣言ファイルかを調べます。宣言ファイルなら、その拡張子（例えば `.d.ts`）が返ってきます。

### 2. 宣言ファイルの拡張子を除いて、新しい拡張子を付ける

```ts:line-numbers=873
        return path.slice(0, path.length - declarationExtension.length) +
            (startsWith(newExtension, ".") ? newExtension : ("." + newExtension));
```

拡張子の部分を取り除いた前半に、新しい拡張子を付けます。新しい拡張子がドットで始まっていなければ、ドットを補います。

### 3. 通常の拡張子は、既存の関数に任せる

```ts:line-numbers=876
    return changeAnyExtension(path, newExtension);
```

宣言ファイルでなければ、`changeAnyExtension` で普通に付け替えます。

## ここがすごい

- **二重の拡張子を 1 つの単位として扱う**: `.d.ts` を通常の `.ts` と同じに扱うと、`a.d.js` という誤った名前が生まれます。宣言ファイルを特別扱いすることで、この誤りを防いでいます。
- **役割の分担**: 宣言ファイルの処理はこの関数、通常の拡張子は `changeAnyExtension` と、責任が分かれています。
- **ドットの補完**: 新しい拡張子に `.` が無くても、正しい形にそろえます。呼び出し側の書き方の違いを吸収しています。
- **分かりやすい条件分岐**: 「宣言ファイルか」という 1 つの問いで、2 つの経路を選んでいます。

## まとめ

- 拡張子の付け替えは、二重の拡張子（`.d.ts`）を特別扱いしないと誤った名前になる。
- 宣言ファイルかどうかを先に判定し、経路を分けると処理が分かりやすい。
- 新しい拡張子のドットを補うと、呼び出し側の書き方の違いを吸収できる。
- 責任ごとに関数を分けると、個々の処理が単純になる。
