---
title: "引数が揃うまで関数を返し続けるカリー化"
description: "複数の引数を取る関数を、1 つずつ引数を受け取る関数の連なりに変える curry。関数の length プロパティで必要な引数の数を知り、再帰で組み立てる。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/function/curry.ts
lines: [159, 179]
function: "curry"
difficulty: 2
tags: [関数型, 再帰, クロージャ]
---

## ひとことで

`curry(func)` は、`func(a, b, c)` のように一度に引数を渡す関数を、`f(a)(b)(c)` のように **1 つずつ渡せる関数** に変換します。これを「カリー化」と呼びます。

```ts
const add = (a: number, b: number, c: number) => a + b + c
const curried = curry(add)
curried(1)(2)(3) // 6
const add1 = curried(1) // 「1 を足す準備ができた関数」を途中で取り出せる
```

実装は、関数が持つ **`length` プロパティ**（宣言された引数の数）を使い、引数が揃うまで「次の引数を待つ関数」を作り続けるという単純な再帰です。

## コード

```ts:line-numbers=159
export function curry(func: (...args: any[]) => any): (...args: any[]) => any {
  if (func.length === 0 || func.length === 1) {
    return func;
  }

  return function (arg: any) {
    return makeCurry(func, func.length, [arg]);
  };
}

function makeCurry<F extends (...args: any) => any>(origin: F, argsLength: number, args: any[]) {
  if (args.length === argsLength) {
    return origin(...args);
  } else {
    const next = function (arg: Parameters<F>[0]) {
      return makeCurry(origin, argsLength, [...args, arg]);
    };

    return next;
  }
}
```

## 前提知識

- **`func.length`**: JavaScript の関数は、宣言された引数の個数を `length` として持っています。`(a, b, c) => …` なら `3` です（既定値付きの引数や `...rest` は数えません）。
- **カリー化**: 複数の引数を取る関数を、引数を 1 つ受け取って「次の引数を受け取る関数」を返す形に変えることです。関数型プログラミングでよく使われます。
- **`[...args, arg]`**: スプレッド構文で、配列 `args` の後ろに `arg` を足した **新しい配列** を作ります。元の `args` は変わりません。
- **`origin(...args)`**: 配列 `args` の中身を引数として展開して呼び出します。
- **オーバーロード**: ファイルの上のほうには、引数の数ごとに「どういう型の関数が返るか」だけを書いた宣言が並んでいます。動く本体はこの 1 つです。

## 何をしているか

### 1. 引数が 0 個か 1 個なら何もしない（160〜162 行目）

もともと 1 つずつしか引数を取らないので、変換は不要です。そのまま返します。

### 2. 最初の引数を受け取る関数を返す（164〜166 行目）

最初の引数 `arg` を受け取ったら、`makeCurry` に「元の関数」「必要な引数の数」「ここまでの引数 `[arg]`」を渡します。

### 3. 揃ったら実行、まだなら次を待つ（169〜179 行目）

`makeCurry` は、集まった引数が必要な数に達していれば元の関数を呼びます（170〜171 行目）。足りなければ、次の引数を受け取って `[...args, arg]` で 1 つ増やし、自分自身をもう一度呼ぶ関数を返します（173〜177 行目）。

`curried(1)(2)(3)` の流れは次のとおりです。

```
curried(1)  → makeCurry(add, 3, [1])       → まだ 1 個。関数を返す
  (2)       → makeCurry(add, 3, [1, 2])    → まだ 2 個。関数を返す
  (3)       → makeCurry(add, 3, [1, 2, 3]) → 揃ったので add(1, 2, 3) = 6
```

## ここがすごい

- **途中の状態を共有しない**: `[...args, arg]` で毎回新しい配列を作るので、途中まで適用した関数を何度使い回しても互いに影響しません。`const add1 = curried(1)` から `add1(2)` と `add1(10)` を作っても、それぞれ別の配列を持ちます。もし `args.push(arg)` と書いていたら、2 回目の呼び出しで前の引数が混ざってしまいます。
- **`length` という言語機能をうまく使う**: 「何個集まったら実行するか」を使う人に指定させず、関数自身から読み取っています。
- **型はオーバーロードで丁寧に**: 実装は `any` で単純に書き、引数が 5 個までは型付きのオーバーロードを用意して、使う人には正確な型を見せています。「実装の単純さ」と「使う側の型の正確さ」を分けて両立させる、TypeScript ライブラリでよくある設計です。

## まとめ

- カリー化は「引数が揃うまで、次を待つ関数を返す」再帰で書ける。
- `func.length` で関数の引数の数を知ることができる。
- 途中の引数は毎回新しい配列で持つと、部分適用した関数を安全に使い回せる。
