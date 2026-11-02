---
title: "拡張子が候補のどれかに当てはまるかを調べる"
description: "TypeScript のコンパイラの fileExtensionIsOneOf は、ファイル名の拡張子が候補の一覧のどれかと一致するかを調べる。見つかった時点で結果を返す早期終了の形。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [125, 133]
function: "fileExtensionIsOneOf"
difficulty: 1
format: 2
tags: [イテレータ, 文字列処理]
---

## ひとことで

`fileExtensionIsOneOf(path, extensions)` は、ファイルの拡張子が、与えられた候補の一覧のどれかと一致するかを判定する関数です。

```ts
fileExtensionIsOneOf('a.ts', ['.ts', '.tsx'])  // true
fileExtensionIsOneOf('a.js', ['.ts', '.tsx'])  // false
```

## コード

```ts:line-numbers=125
export function fileExtensionIsOneOf(path: string, extensions: readonly string[]): boolean {
    for (const extension of extensions) {
        if (fileExtensionIs(path, extension)) {
            return true;
        }
    }

    return false;
}
```

## 前提知識

- **拡張子**: ファイル名の末尾にある `.ts` や `.js` のような部分です。
- **早期 return**: 答えが分かった時点で、残りを調べずに関数を終える書き方です。
- **`fileExtensionIs`**: 同じファイルの中にある関数で、1 つの拡張子だけを比べます。この関数は、それを候補の数だけ繰り返します。

## 何をしているか

### 1. 候補を 1 つずつ比べる

```ts:line-numbers=126
    for (const extension of extensions) {
        if (fileExtensionIs(path, extension)) {
            return true;
        }
    }
```

候補を先頭から順に、`fileExtensionIs` で比べます。1 つでも一致すれば、その時点で `true` を返して終わります。

### 2. 一つも一致しなければ偽を返す

```ts:line-numbers=132
    return false;
```

すべての候補を比べても一致しなかったときの答えです。

## ここがすごい

- **無駄な比較をしない**: 一致が見つかったら残りの候補を調べません。候補が多くても、早く答えが出ます。
- **比べる仕事を外に任せる**: 拡張子の比べ方は `fileExtensionIs` に任せ、この関数は候補を回すことだけに集中しています。
- **候補の形が自由**: 候補は配列なので、必要な数だけ渡せます。

## まとめ

- `fileExtensionIsOneOf` は、拡張子が候補のどれかに一致するかを調べる。
- 一致した時点で `true` を返し、残りは調べない。
- 比べる仕事は `fileExtensionIs` に任せ、この関数は候補を回すだけ。
