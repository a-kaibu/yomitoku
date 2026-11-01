---
title: "ほとんどのパスは正規化いらず、を正規表現 1 回で見抜く"
description: "パスの正規化の前に呼ばれる高速な近道。正規表現 1 回で「直す必要がない」ことを確認し、/./ だけなら置換で済ませる。重い処理が必要なときだけ undefined を返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [732, 749]
function: "simpleNormalizePath"
difficulty: 2
format: 2
tags: [最適化, 正規表現, ファイル]
---

## ひとことで

TypeScript コンパイラはファイルのパスを何万回も扱います。`simpleNormalizePath` は、パスの正規化（`a/./b/../c` を `a/c` にするなど）の **前に試す近道** です。

関数の先頭のコメントのとおり、「ほとんどのパスは正規化を必要としない」ので、まず正規表現 1 回でそれを確かめます。直す必要がなければそのまま、簡単な置換で済めば置換して返します。本格的な処理が必要なときだけ `undefined` を返し、呼び出し側に任せます。

## コード

::: code-group

```ts:line-numbers=732 [日本語訳]
function simpleNormalizePath(path: string): string | undefined {
    // // ほとんどのパスは正規化を必要としない
    if (!relativePathSegmentRegExp.test(path)) {
        return path;
    }
    // // 「/./」や先頭の「./」だけの後始末が必要なパスもある
    let simplified = path.replace(/\/\.\//g, "/");
    if (simplified.startsWith("./")) {
        simplified = simplified.slice(2);
    }
    if (simplified !== path) {
        path = simplified;
        if (!relativePathSegmentRegExp.test(path)) {
            return path;
        }
    }
    return undefined;
}
```

```ts:line-numbers=732 [原文]
function simpleNormalizePath(path: string): string | undefined {
    // Most paths don't require normalization
    if (!relativePathSegmentRegExp.test(path)) {
        return path;
    }
    // Some paths only require cleanup of `/./` or leading `./`
    let simplified = path.replace(/\/\.\//g, "/");
    if (simplified.startsWith("./")) {
        simplified = simplified.slice(2);
    }
    if (simplified !== path) {
        path = simplified;
        if (!relativePathSegmentRegExp.test(path)) {
            return path;
        }
    }
    return undefined;
}
```

:::

`relativePathSegmentRegExp` は同じファイルで次のように定義されています。

```ts:line-numbers=882
const relativePathSegmentRegExp = /\/\/|(?:^|\/)\.\.?(?:$|\/)/;
```

## 前提知識

- **正規表現 `/\/\/|(?:^|\/)\.\.?(?:$|\/)/`**: `|` の左は「`//`（スラッシュの重なり）」、右は「先頭か `/` のあとに、`.` か `..` があり、その後ろが末尾か `/`」です。つまり、**`//`、`.`、`..` という部品のどれかを含むか** を調べています。`(?:…)` は、まとめるだけで値を取り出さないかっこです。
- **`re.test(str)`**: 文字列が正規表現に一致する部分を含むかを `true` / `false` で返します。
- **`replace(/\/\.\//g, "/")`**: `/./` をすべて `/` に置き換えます。
- **`startsWith` / `slice(2)`**: 先頭が `./` かを確かめ、そうなら先頭 2 文字を取り除きます。
- **`string | undefined`**: 結果の文字列か、「この方法では無理」を表す `undefined` を返します。

## 何をしているか

### 1. 直す必要がなければそのまま

```ts:line-numbers=734
    if (!relativePathSegmentRegExp.test(path)) {
        return path;
    }
```
`src/compiler/core.ts` のような普通のパスは、ここで終わります。

### 2. `/./` と先頭の `./` を消す

```ts:line-numbers=738
    let simplified = path.replace(/\/\.\//g, "/");
    if (simplified.startsWith("./")) {
        simplified = simplified.slice(2);
    }
```
`./src/./a.ts` → `src/a.ts` のように、`.` の部品だけは置換で消せます。

### 3. 消したあとにもう一度確かめる

```ts:line-numbers=742
    if (simplified !== path) {
        path = simplified;
        if (!relativePathSegmentRegExp.test(path)) {
            return path;
        }
    }
```
置換で何か変わったら、もう一度正規表現で調べ、もう直すところがなければ返します。`..` や `//` が残っていれば、ここでは処理できません。

### 4. 本格的な処理が必要

```ts:line-numbers=748
    return undefined;
```
`undefined` を返して、呼び出し側の重い正規化に任せます。

```
'src/a.ts'      → そのまま 'src/a.ts'
'./src/./a.ts'  → 置換で 'src/a.ts'
'src/../a.ts'   → undefined（.. の処理が必要）
```

## ここがすごい

- **よくある場合を最速に**: 本格的な正規化は、パスを 1 文字ずつ読んで部品を組み立て直す、それなりに重い処理です。大多数のパスは正規表現 1 回の確認だけで済むので、全体の処理時間が大きく減ります。「よくある場合を速く、まれな場合は正しく」という最適化の基本です。
- **段階的な近道**: 「何もしない」「置換だけ」「本格的」と 3 段階に分け、軽いものから順に試しています。`.` の除去は置換で安全にできますが、`..` は直前の部品を消す必要があるので置換ではできません。その違いを見極めて、できることだけをしています。
- **`undefined` で「担当外」を伝える**: 結果を返せないときに例外を投げるのではなく `undefined` を返すので、呼び出し側は `??` などで簡単に次の手段に切り替えられます。

## まとめ

- 重い処理の前に「本当に必要か」を安く確かめると、全体が速くなる。
- 近道は、軽いものから順に何段階か用意できる。
- 「この方法では無理」を `undefined` で返すと、呼び出し側で次の手段に切り替えやすい。
