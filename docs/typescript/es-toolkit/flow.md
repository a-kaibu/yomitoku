---
title: "関数を左から順につなぐパイプライン"
description: "複数の関数をつないで 1 つの関数にする flow。最初の関数だけ引数をすべて受け取り、残りは前の結果を 1 つ受け取るという非対称さがポイント。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/function/flow.ts
lines: [161, 171]
function: "flow"
difficulty: 1
tags: [関数型, ジェネリクス, イディオム]
---

## ひとことで

`flow(f1, f2, f3)` は、**`f1` の結果を `f2` に、その結果を `f3` に渡す** 1 つの関数を作ります。データを工場のラインに流すように、処理を左から順につなげられます。

```ts
const toSlug = flow(
  (s: string) => s.trim(),
  (s) => s.toLowerCase(),
  (s) => s.replace(/\s+/g, '-'),
)
toSlug('  Hello World ') // 'hello-world'
```

本体はたった 10 行です。それでいて、最初の関数だけは引数を複数受け取れるようにするなど、細かい配慮があります。

## コード

```ts:line-numbers=161
export function flow(...funcs: Array<(...args: any[]) => any>): (...args: any[]) => any {
  return function (this: any, ...args: any[]) {
    let result = funcs.length ? funcs[0].apply(this, args) : args[0];

    for (let i = 1; i < funcs.length; i++) {
      result = funcs[i].call(this, result);
    }

    return result;
  };
}
```

## 前提知識

- **`...funcs`**: 残り引数（レストパラメータ）。渡された関数がすべて配列 `funcs` に入ります。
- **`Array<(...args: any[]) => any>`**: 「どんな引数でも受け取って何かを返す関数」の配列という型です。
- **`apply` と `call`**: どちらも `this` を指定して関数を呼ぶ方法です。`apply(this, 配列)` は引数を配列で、`call(this, 値)` は引数を 1 つずつ渡します。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` になる式です。
- **オーバーロード**: ファイルの上部には、関数が 1〜5 個のときの型だけの宣言が並んでいます。これのおかげで、`flow(f1, f2)` の戻り値の型が「`f1` の引数を受け取り、`f2` の戻り値を返す関数」だと TypeScript が正しく推論できます。

## 何をしているか

### 1. 最初の関数を実行する（163 行目）

最初の関数 `funcs[0]` には、作った関数に渡された **引数をすべて** `apply` で渡します。関数が 1 つも渡されていなければ、最初の引数をそのまま結果にします（何もしない関数として振る舞う）。

### 2. 残りを順に通す（165〜167 行目）

2 番目以降の関数には、前の結果を **1 つだけ** `call` で渡し、結果を上書きしていきます。

上の `toSlug` なら次のように進みます。

```
'  Hello World ' → trim → 'Hello World' → toLowerCase → 'hello world' → replace → 'hello-world'
```

### 3. 最後の結果を返す（169 行目）

## ここがすごい

- **入口だけ引数を複数受け取れる**: 関数は値を 1 つしか返せないので、2 番目以降には 1 つしか渡せません。しかし入口は自由なので、`flow((a: number, b: number) => a + b, (n) => n * 2)` のように複数の引数から始められます。この非対称さをきちんと実装と型の両方に反映しています。
- **`this` を最後まで運ぶ**: `apply(this, …)` と `call(this, …)` を使うので、`flow` で作った関数をオブジェクトのメソッドとして使っても、つないだ関数の中から同じ `this` を参照できます。
- **関数 0 個でも壊れない**: `funcs.length` が 0 のときは恒等関数（受け取った値をそのまま返す関数）として動きます。境界の場合でもエラーにならないのは、関数を動的に組み立てるときに便利です。
- **型推論はオーバーロードに任せる**: 本体は `any` で簡潔に書き、型の正確さは宣言側で担保しています。長さの決まっていない関数の連なりを完全に型付けするのは難しいので、よく使う 5 個までを手で書くという実用的な割り切りです。

## まとめ

- `flow` は処理を左から右へ読める順につなぐ道具。
- 先頭の関数だけ引数を複数受け取れるのは、関数の戻り値が 1 つだから。
- 実装は単純に、型の正確さはオーバーロードで、という分担は TypeScript ライブラリの定番。
