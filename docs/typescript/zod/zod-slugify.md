---
title: "4 回の置換で URL に使える英数字の文字列にする"
description: "任意の文字列を URL のスラッグに変える slugify。小文字化、前後の空白の削除、記号の除去、区切りの統一を、正規表現の置換を 4 回つないで行う。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [500, 511]
function: "slugify"
difficulty: 1
format: 2
tags: [文字列処理, 正規表現, イディオム]
---

## ひとことで

`slugify(input)` は、タイトルのような文字列を、URL に使いやすい **スラッグ**（英小文字・数字・`-` だけの文字列）に変換します。

```ts
slugify('  Hello, World!  ')   // 'hello-world'
slugify('Foo_bar -- Baz')      // 'foo-bar-baz'
```

Zod のドキュメントやスキーマ名から、リンク用の ID を作るときなどに使われます。

## コード

```ts:line-numbers=500
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const captureStackTrace: (targetObject: object, constructorOpt?: Function) => void = (
  "captureStackTrace" in Error ? Error.captureStackTrace : (..._args: any[]) => {}
) as any;
```

## 前提知識

- **メソッドチェーン**: `a.b().c()` のように、前の結果に次のメソッドを続けて呼ぶ書き方です。ここでは文字列が 1 段ずつ変わっていきます。
- **`toLowerCase` / `trim`**: 英字を小文字にし、前後の空白を取り除きます。
- **正規表現の `\w` と `\s`**: `\w` は英数字と `_`、`\s` は空白類の文字です。`[^\w\s-]` は、それ以外の文字（記号など）を表します。
- **`+` と `*`**: 直前の文字が 1 回以上（`+`）、0 回以上（`*`）続くことを表します。

## 何をしているか

### 1. 小文字にして、前後の空白を取る

```ts:line-numbers=501
  return input
    .toLowerCase()
    .trim()
```

大文字と小文字の違いや前後の空白を、先にそろえておきます。

### 2. 英数字・空白・`-` 以外を消す

```ts:line-numbers=504
    .replace(/[^\w\s-]/g, "")
```

`[^\w\s-]` に当てはまる記号を、空文字列に置き換えて消します。

### 3. 空白や `_`、`-` の並びを 1 つの `-` にする

```ts:line-numbers=505
    .replace(/[\s_-]+/g, "-")
```

`[\s_-]+` は、空白・アンダースコア・ハイフンの連なりです。それらを、まとめて 1 つの `-` にします。

### 4. 先頭と末尾の `-` を消す

```ts:line-numbers=506
    .replace(/^-+|-+$/g, "");
```

`^-+|-+$` は、先頭または末尾にある `-` の連なりです。最後にそれを取り除きます。

`'  Foo_bar -- Baz  '` を追うと、次のように変わります。

```
小文字・trim → 'foo_bar -- baz'
記号を除去   → 'foo_bar -- baz'
区切りを統一 → 'foo-bar-baz'
端を除去     → 'foo-bar-baz'
```

## ここがすごい

- **順番に意味が積み上がる**: 最初に小文字にしてから、区切りを統一し、最後に端を消す、という順番になっています。先に端を消すと、記号を消したあとに余った `-` が残ってしまいます。
- **正規表現を読むだけで仕様が分かる**: 4 つの置換は、それぞれ「消す」「まとめる」「取る」という 1 つの役割だけを持っています。そのため、読んだだけで変換の規則が分かります。
- **例外的な分岐がない**: どんな入力でも同じ 4 段階を通るので、短い入力や空の入力でも特別な処理は要りません。

## まとめ

- URL の ID は、小文字化・記号除去・区切りの統一・端の除去、の順で作る。
- 正規表現の置換は、役割を 1 つずつ分けると読みやすい。
- 順番が変わると結果が変わるので、途中の状態を追うと理解しやすい。
