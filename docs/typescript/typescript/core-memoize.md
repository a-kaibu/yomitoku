---
title: "呼んだあとにコールバック自身を捨てる memoize"
description: "引数なしの関数を 1 回だけ実行して結果を覚える memoize。実行済みかどうかの旗を持たず、コールバックを undefined にすることで旗の代わりにし、参照も手放している。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1891, 1900]
function: "memoize"
difficulty: 2
tags: [キャッシュ, クロージャ, メモリ管理]
---

## ひとことで

`memoize(callback)` は、引数なしの関数 `callback` を **最初に呼ばれたときだけ実行し、その結果を覚えておく** 関数を返します。2 回目以降は覚えた値を返すだけです。

```ts
const getConfig = memoize(() => readConfigFile())
getConfig() // ファイルを読む
getConfig() // 読まずに前回の結果を返す
```

普通なら「実行済み」の旗を別に用意しますが、この実装は **`callback` 自体を消すこと** を旗の代わりにしています。

## コード

```ts:line-numbers=1891
export function memoize<T>(callback: () => T): () => T {
    let value: T;
    return () => {
        if (callback) {
            value = callback();
            callback = undefined!;
        }
        return value;
    };
}
```

## 前提知識

- **クロージャ**: 関数の中で作った関数は、外側の変数（ここでは `value` と、引数の `callback`）を覚えていて、あとから読み書きできます。
- **引数への再代入**: JavaScript では、関数の引数もふつうの変数として書き換えられます。1896 行目では引数 `callback` を書き換えています。
- **`undefined!`**: 末尾の `!` は「`null` や `undefined` ではない」と TypeScript に伝える記号です。`callback` の型は関数なので本来 `undefined` は入れられませんが、`!` で型チェックを通しています。
- **真偽値としての関数**: `if (callback)` は、`callback` が関数なら真、`undefined` なら偽になります。

## 何をしているか

返される関数が呼ばれるたびに、次のことをします。

1. `callback` がまだあれば（1894 行目）、実行して結果を `value` に入れ（1895 行目）、`callback` を `undefined` にします（1896 行目）。
2. `value` を返します（1898 行目）。

2 回目に呼ばれたときは `callback` が `undefined` なので、1895 行目は実行されません。

## ここがすごい

- **旗がいらない**: 「もう実行したか」を表す `let done = false` のような変数を用意しなくても、`callback` が残っているかどうかで判定できます。状態が 1 つ少ないので、旗と値がずれるといった間違いも起きません。
- **参照を手放してメモリを解放できる**: これがいちばん大事な効果です。`callback` は、自分が作られた場所の変数を（クロージャとして）抱え込んでいることがあります。たとえば大きな構文木や、ファイルの中身などです。`callback` を `undefined` にすると、memoize の関数がそれらを参照し続けることがなくなり、ガベージコレクタ（使われなくなったメモリを自動で回収する仕組み）が回収できるようになります。コンパイラのように大量のデータを扱うプログラムでは、こうした小さな解放の積み重ねが効きます。
- **`undefined` を返す関数でも正しく動く**: 「`value` が `undefined` なら未実行」と判定する方法だと、`callback` がもともと `undefined` を返す関数のときに毎回実行されてしまいます。`callback` の有無で判定するこの方法なら、その問題はありません。

## まとめ

- 「1 回だけ実行」は、実行したあとに関数そのものを捨てれば旗なしで書ける。
- 使い終わった関数を捨てると、その関数が抱えていたデータもメモリから解放できる。
- 判定に使う状態を減らすと、状態どうしのずれによるバグが起きにくくなる。
