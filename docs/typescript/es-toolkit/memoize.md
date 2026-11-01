---
title: "キャッシュの入れ物を差し替えられるメモ化"
description: "一度計算した結果を覚えておく memoize。キャッシュの型をインターフェースで決めておき、Map 以外の入れ物にも差し替えられるようにしている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/function/memoize.ts
lines: [74, 100]
function: "memoize"
difficulty: 2
format: 2
tags: [キャッシュ, 設計パターン, ジェネリクス]
---

## ひとことで

`memoize(fn)` は、`fn` の計算結果を引数ごとに覚えておき、同じ引数でもう一度呼ばれたら **計算せずに覚えた値を返す** 関数を作ります。これを「メモ化」と呼びます。

たとえば重い計算 `fib(40)` を一度メモ化して呼べば、2 回目以降は一瞬で答えが返ります。

この実装の工夫は、結果を覚える入れ物（キャッシュ）を `Map` に決め打ちせず、**同じ形のメソッドを持つものなら何でも使える** ようにしている点です。

## コード

```ts:line-numbers=74
export function memoize<F extends (...args: any) => any>(
  fn: F,
  options: {
    cache?: MemoizeCache<any, ReturnType<F>>;
    getCacheKey?: (args: Parameters<F>[0]) => unknown;
  } = {}
): F & { cache: MemoizeCache<any, ReturnType<F>> } {
  const { cache = new Map<unknown, ReturnType<F>>(), getCacheKey } = options;

  const memoizedFn = function (this: unknown, arg: Parameters<F>[0]): ReturnType<F> {
    const key = getCacheKey ? getCacheKey(arg) : arg;

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.call(this, arg);

    cache.set(key, result);

    return result;
  };

  memoizedFn.cache = cache;

  return memoizedFn as F & { cache: MemoizeCache<any, ReturnType<F>> };
}
```

`MemoizeCache` は同じファイルの後半で定義されたインターフェースで、`set`・`get`・`has`・`delete`・`clear` と `size` を持つことだけを決めています。

## 前提知識

- **メモ化（memoization）**: 関数の結果を引数ごとに保存して再利用する最適化です。同じ入力に同じ出力を返す関数にだけ使えます。
- **`Map`**: キーと値の組を保存する組み込みのデータ構造です。オブジェクトと違い、数値やオブジェクトそのものもキーにできます。
- **インターフェース**: 「このメソッドとプロパティを持っていること」という形だけを決める型です。TypeScript は形が合っていれば、どのクラスから作ったかは問いません（構造的型付け）。
- **`ReturnType<F>` / `Parameters<F>[0]`**: 関数型 `F` の戻り値の型、最初の引数の型を取り出す組み込みの型です。
- **`cache.get(key)!`**: 末尾の `!` は「ここでは `undefined` ではない」と TypeScript に伝える書き方です。直前の `has` で存在を確認しているので安全です。
- **`F & { cache: ... }`**: `&` は交差型で、「関数 `F` であり、かつ `cache` プロパティも持つ」型を表します。

## 何をしているか

### 1. オプションを取り出す

```ts:line-numbers=81
  const { cache = new Map<unknown, ReturnType<F>>(), getCacheKey } = options;
```
`cache` が渡されなければ新しい `Map` を使います。`getCacheKey` は引数からキャッシュのキーを作る関数で、省略すると引数そのものがキーになります。

### 2. メモ化した関数

```ts:line-numbers=83
  const memoizedFn = function (this: unknown, arg: Parameters<F>[0]): ReturnType<F> {
    const key = getCacheKey ? getCacheKey(arg) : arg;

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.call(this, arg);

    cache.set(key, result);

    return result;
  };
```
1. 引数からキーを作る。

```ts:line-numbers=84
    const key = getCacheKey ? getCacheKey(arg) : arg;
```

2. キャッシュにあればそれを返す。

```ts:line-numbers=86
    if (cache.has(key)) {
      return cache.get(key)!;
    }
```

3. なければ本来の `fn` を呼び、結果を保存してから返す。`fn.call(this, arg)` で、呼び出し元の `this` もそのまま引き継ぎます。

```ts:line-numbers=90
    const result = fn.call(this, arg);

    cache.set(key, result);

    return result;
```


### 3. キャッシュを外から触れるようにする

```ts:line-numbers=97
  memoizedFn.cache = cache;
```
作った関数に `cache` プロパティとして入れ物を付けます。使う側は `memoized.cache.clear()` でキャッシュを空にしたり、`size` で溜まった数を確認したりできます。

## ここがすごい

- **入れ物を差し替えられる**: キャッシュを無制限に溜めるとメモリを食いつぶします。この設計なら、古いものから捨てる LRU キャッシュ（最近使っていないものから消すキャッシュ）を自分で書いて `cache` に渡すだけで、`memoize` 本体は一切変えずに済みます。必要なメソッドだけを決めたインターフェースが、その「差し込み口」になっています。
- **キーの作り方も差し替えられる**: 引数がオブジェクトだと、中身が同じでも別の値として扱われます。`getCacheKey: (obj) => obj.id` のように指定すれば、意味的に同じものを同じキーにまとめられます。
- **引数を 1 つに絞って割り切る**: 複数の引数をキーにするには組み合わせ方を決める必要があり、実装が複雑になります。この関数は最初の引数だけを見ることにして、複数の値が必要なら `getCacheKey` で 1 つにまとめてもらう方針です。シンプルさを優先した設計判断です。

## まとめ

- メモ化は「同じ入力なら同じ出力」の関数を速くする定番の手法。
- 入れ物をインターフェースで受け取ると、捨て方などの方針を外から変えられる。
- キャッシュを外から触れるようにしておくと、テストやメモリ管理がしやすい。
