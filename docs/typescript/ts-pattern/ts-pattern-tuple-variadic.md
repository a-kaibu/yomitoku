---
title: "配列パターンの途中に「残り全部」を書く。可変長の照合"
description: "ts-pattern の配列パターン。P.array を 1 つだけ途中に置くと、前後の要素を先に決めて、残りを全部まとめて照合できる。その振り分けと長さの確認を解説する。"
language: typescript
project: "ts-pattern"
repo: https://github.com/gvergnaud/ts-pattern
license: MIT
copyright: "Copyright (c) 2021 Gabriel Vergnaud"
commit: "f11be73acb18e1d653d4f252e7d75981d873a2e6"
file: src/internals/helpers.ts
lines: [67, 97]
function: "matchPattern"
difficulty: 3
format: 2
tags: [パース, 型システム, 再帰]
---

## ひとことで

ts-pattern の配列パターンでは、`[first, ...rest, last]` のように、途中に「長さが決まらない部分」を 1 つだけ置けます。この部分を `matchPattern` が見つけて、先頭・末尾・真ん中に分けて照合します。配列の長さが違っていても、形が合えば一致します。

```ts
match([1, 2, 3, 4])
  .with([P.number, ...P.array(), P.number], () => 'OK') // 'OK'
```

## コード

```ts:line-numbers=67
      if (variadicPatterns.length) {
        if (variadicPatterns.length > 1) {
          throw new Error(
            `Pattern error: Using \`...P.array(...)\` several times in a single pattern is not allowed.`
          );
        }

        if (value.length < startPatterns.length + endPatterns.length) {
          return false;
        }

        const startValues = value.slice(0, startPatterns.length);
        const endValues =
          endPatterns.length === 0 ? [] : value.slice(-endPatterns.length);
        const middleValues = value.slice(
          startPatterns.length,
          endPatterns.length === 0 ? Infinity : -endPatterns.length
        );

        return (
          startPatterns.every((subPattern, i) =>
            matchPattern(subPattern, startValues[i], select)
          ) &&
          endPatterns.every((subPattern, i) =>
            matchPattern(subPattern, endValues[i], select)
          ) &&
          (variadicPatterns.length === 0
            ? true
            : matchPattern(variadicPatterns[0], middleValues, select))
        );
      }
```

## 前提知識

- **可変長（variadic）**: 長さが決まっていない、という意味です。ここでは「何個でもよい要素の並び」を指します。
- **`slice(start, end)`**: 配列の一部をコピーして新しい配列を作るメソッドです。`end` に負の数を入れると、末尾からの位置になります。
- **`every`**: 配列のすべての要素が条件を満たすかを調べるメソッドです。1 つでも満たさなければ `false` になります。
- **`Infinity`**: 無限大を表す数です。`slice` の終わりに使うと、配列の最後までを意味します。
- **三項演算子と `&&`**: 条件に応じて値を選んだり、複数の条件をすべて満たすか調べたりする書き方です。

## 何をしているか

### 1. 可変長の部分は 1 つだけに限る

```ts:line-numbers=68
        if (variadicPatterns.length > 1) {
```

`...P.array()` を 2 つ以上書くと、どこまでが真ん中か決まらないので、エラーにします。

### 2. 短すぎる配列は、すぐに不一致にする

```ts:line-numbers=74
        if (value.length < startPatterns.length + endPatterns.length) {
          return false;
        }
```

前後に書いた要素の数より配列が短ければ、照合は始められません。`false` を返します。

### 3. 先頭・末尾・真ん中に切り分ける

```ts:line-numbers=78
        const startValues = value.slice(0, startPatterns.length);
        const endValues =
          endPatterns.length === 0 ? [] : value.slice(-endPatterns.length);
        const middleValues = value.slice(
          startPatterns.length,
          endPatterns.length === 0 ? Infinity : -endPatterns.length
        );
```

先頭は前から、末尾は後ろから、真ん中は残りの部分を取り出します。末尾が無いときは `Infinity` で、真ん中を最後まで取ります。

### 4. 3 つの部分をそれぞれ照合する

```ts:line-numbers=86
        return (
          startPatterns.every((subPattern, i) =>
            matchPattern(subPattern, startValues[i], select)
          ) &&
```

先頭、末尾、真ん中の順に、対応するパターンで `matchPattern` を呼びます。3 つすべてが一致したときだけ、全体が一致になります。

## ここがすごい

- **真ん中を配列のまま照合する**: 真ん中の値を 1 つずつ数えるのではなく、真ん中全体を 1 つの配列として `matchPattern` に渡します。`P.array(...)` も同じ仕組みで照合できます。
- **再帰で同じ道具を使う**: 真ん中の照合も、他のパターンと同じ `matchPattern` で行います。新しい書き方を増やさずに済みます。
- **無効な書き方を早く見つける**: 可変長を 2 つ書いた場合は、照合を始める前にエラーにします。書き間違いを、実行時の分かりやすいメッセージで知らせます。
- **`Infinity` で場合分けを減らす**: 末尾が無いときの `slice` の終わりを `Infinity` にすることで、同じ式で末尾あり・なしの両方を扱えます。

## まとめ

- 配列のパターンでは、可変長の部分は 1 つだけ許し、先頭・末尾・真ん中に分けて照合する。
- 長さが足りないときは、すぐ不一致にして無駄な処理を避ける。
- `slice` の負の位置と `Infinity` を使うと、末尾の有無を 1 つの式で扱える。
- 真ん中も同じ照合の仕組みで調べると、部品を増やさずに済む。
