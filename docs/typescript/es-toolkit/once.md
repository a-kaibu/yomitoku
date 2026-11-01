---
title: "クロージャに旗を 1 本立てるだけで「最初の 1 回だけ」"
description: "何回呼んでも最初の 1 回しか実行しない関数を作る once。クロージャの中の変数 2 つで、実行済みかどうかと結果を覚えている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/function/once.ts
lines: [34, 46]
function: "once"
difficulty: 1
format: 2
tags: [クロージャ, 関数型, イディオム]
---

## ひとことで

`once(func)` は、何回呼んでも **`func` を最初の 1 回だけ実行** し、2 回目以降は 1 回目の結果をそのまま返す関数を作ります。
初期化処理や「ボタンを連打されても送信は 1 回だけ」にしたい場面で使います。

わずか 10 行ほどですが、JavaScript の **クロージャ**（関数が、自分が作られた場所の変数を覚えている仕組み）の使い方の見本のようなコードです。

## コード

```ts:line-numbers=34
export function once<F extends (() => any) | ((...args: any[]) => void)>(func: F): F {
  let called = false;
  let cache: ReturnType<F>;

  return function (this: unknown, ...args: Parameters<F>): ReturnType<F> {
    if (!called) {
      called = true;
      cache = func.apply(this, args);
    }

    return cache;
  } as F;
}
```

## 前提知識

- **クロージャ**: 関数の中で作った関数は、外側の関数の変数を覚えていて、外側の関数が終わったあとも読み書きできます。ここでは `called` と `cache` がそれにあたります。
- **`let cache: ReturnType<F>;`**: 変数を型だけ宣言して、値はまだ入れていない状態です。`ReturnType<F>` は関数 `F` の戻り値の型です。
- **`function (this: unknown, ...args)`**: `this` の型を宣言しています。`unknown` は「何かはわからない値」を表す型です。
- **`func.apply(this, args)`**: `this` と引数の配列を指定して関数を呼びます。メソッドとして呼ばれた場合も正しく `this` を引き継げます。
- **`as F`**: 型アサーション（「この値はこの型として扱って」と TypeScript に伝えること）です。作った関数を、元の関数と同じ型として返しています。

## 何をしているか

### 1. 状態を 2 つ用意する

```ts:line-numbers=35
  let called = false;
  let cache: ReturnType<F>;
```
`called` は「もう呼んだか」の旗、`cache` は 1 回目の結果の保存場所です。この 2 つは `once` を呼ぶたびに新しく作られ、返す関数だけが触れます。

### 2. 返す関数

```ts:line-numbers=38
  return function (this: unknown, ...args: Parameters<F>): ReturnType<F> {
    if (!called) {
      called = true;
      cache = func.apply(this, args);
    }

    return cache;
  } as F;
```
- 旗が立っていなければ、**先に旗を立ててから** `func` を実行し、結果を保存します。

```ts:line-numbers=39
    if (!called) {
      called = true;
      cache = func.apply(this, args);
    }
```

- 旗の状態に関係なく、保存した結果を返します。

```ts:line-numbers=44
    return cache;
```


```ts
const init = once(() => { console.log('初期化'); return 42 })
init() // 「初期化」と表示して 42
init() // 何も表示せず 42
```

## ここがすごい

- **旗を「先に」立てる**: `called = true` を `func` の実行より前に書いています。もし `func` の中から同じ関数がもう一度呼ばれても（再帰的な呼び出し）、二重に実行されることがありません。また `func` がエラーを投げた場合でも、2 回目は実行されなくなります。
- **結果がなくても判定できる**: 「`cache` が空なら未実行」と判定する書き方もありえますが、`func` が `undefined` を返す関数だと区別できません。旗を別に持つことで、どんな戻り値でも正しく判定できます。
- **状態が外から見えない**: `called` と `cache` はクロージャの中にしかないので、外のコードがうっかり書き換えることはできません。クラスを使わずに「隠れた状態」を持つ、関数型らしいテクニックです。
- **型を崩さない**: 戻り値を `as F` で元の関数と同じ型にしているので、使う側は引数や戻り値の型チェックをそのまま受けられます。

## まとめ

- クロージャを使うと、関数ごとに専用の隠れた状態を持たせられる。
- 「実行済み」は結果とは別の旗で管理すると、`undefined` を返す関数でも正しく動く。
- 旗は処理の前に立てると、再入やエラーのときも二重実行を防げる。
