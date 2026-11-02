---
title: "ファイル名が指定の拡張子で終わるかを確かめる"
description: "TypeScript コンパイラの fileExtensionIs。パスが指定した拡張子で終わるかを判定する。拡張子そのものだけのパスは除くため、長さも比べている。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [120, 122]
function: "fileExtensionIs"
difficulty: 1
format: 2
tags: [ファイル, 文字列処理, 防御的プログラミング]
---

## ひとことで

`fileExtensionIs(path, extension)` は、パスが指定した拡張子で終わるかを判定する関数です。`fileExtensionIs('a/b.d.ts', '.d.ts')` は `true` を返します。拡張子そのものだけのパス（たとえば `.d.ts` という名前のファイル）は、拡張子の付いたファイルとは扱わない点が特徴です。

```ts
fileExtensionIs('src/a.ts', '.ts')    // true
fileExtensionIs('src/a.js', '.ts')    // false
fileExtensionIs('.ts', '.ts')         // false（拡張子だけでは、ファイル名がない）
```

## コード

```ts:line-numbers=120
export function fileExtensionIs(path: string, extension: string): boolean {
    return path.length > extension.length && endsWith(path, extension);
}
```

## 前提知識

- **`endsWith`**: 文字列が指定の文字列で終わるかを判定する、コンパイラの内部関数です。
- **`length`**: 文字列の文字数です。`path.length > extension.length` は、「拡張子より長い」ことを表します。
- **`&&`（かつ）**: 両方が真のときだけ真になります。途中で偽なら、右側は調べません。
- **拡張子の表記**: `.ts` のようにドットを含めて書くのが、この関数の約束です。

## 何をしているか

### 1. パスが拡張子より長いかを確かめる

```ts:line-numbers=121
    return path.length > extension.length && endsWith(path, extension);
```

`path.length > extension.length` で、パスが拡張子と同じ長さか短いかを先に確かめます。同じ長さなら、拡張子だけのパスなので、ここで `false` になります。

### 2. 指定の拡張子で終わるかを確かめる

同じ行の `endsWith(path, extension)` の部分です。長さの条件を満たしたうえで、パスが拡張子で終わっているかを判定します。

## ここがすごい

- **拡張子だけのパスを除く**: `.ts` という名前のファイルは、拡張子だけでファイル名がありません。長さを比べることで、この例外を自然に弾いています。
- **順番に安い条件を置く**: 長さの比較は、文字列全体を調べる `endsWith` より速いです。先に軽い条件を置くことで、無駄な比較を減らしています。
- **名前と意味が一致**: 「拡張子か」を判定する関数の名前に、中身がそのまま対応しています。
- **拡張子の表記に注意**: ドットを含めて書く約束なので、`ts` と `.ts` を取り違える誤りは、この関数の外で防ぐ必要があります。

## まとめ

- 拡張子の判定は、長さを比べてから末尾の一致を確かめると、例外も正しく扱える。
- 軽い条件を先に置くと、無駄な比較が減る。
- 拡張子はドット付きで書く約束を、関数の説明に残しておくと誤用を防げる。
- 関数の名前と中身を一致させると、読み手が迷わない。
