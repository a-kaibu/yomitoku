---
title: "値を作る関数を包んで、結果を後から取り出せるようにする"
description: "zod の cached は、値を作る関数を受け取り、その結果を value として後から取り出せる形に包む。値が必要になるまで計算を遅らせる仕組み。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [313, 315]
function: "cached"
difficulty: 2
format: 2
tags: [キャッシュ, 遅延評価, ジェネリクス]
---

## ひとことで

`cached(getter)` は、値を作る関数を受け取り、その値を `value` という属性から取り出せる形に包んで返す関数です。値を使う場面まで、計算を後回しにできます。

```ts
const box = cached(() => heavyWork())
box.value  // ここで初めて heavyWork が呼ばれる（中の仕組みによる）
```

## コード

```ts:line-numbers=313
export function cached<T>(getter: () => T): { value: T } {
  return new Cached(getter);
}
```

## 前提知識

- **関数を値として渡す**: 値そのものではなく、「値を作る手順」を関数として渡すことです。
- **遅延評価**: 値が本当に必要になるまで、計算を実行しない考え方です。
- **ジェネリクス `<T>`**: 包んだ値の型を、呼び出すたびに決める仕組みです。戻り値の `{ value: T }` の `T` が、元の関数の戻り値の型になります。

## 何をしているか

### 1. 関数を Cached に渡す

```ts:line-numbers=314
  return new Cached(getter);
```

渡された `getter` を、同じファイルの中にある `Cached` というクラスに渡して、新しい入れ物を作ります。入れ物は、後から `value` を求められたときに `getter` を使う、という仕組みです。

### 2. 戻り値の型を示す

`{ value: T }` という型で、取り出せる値が `value` の 1 つであることを示します。呼び出す側は、ただの値ではなく、取り出して使うものだと分かります。

## ここがすごい

- **使うまで計算しない**: 値を作る重い処理を、本当に必要な場面まで後ろにずらせます。
- **型で取り出し方が分かる**: 戻り値の型に `value` が明記されるので、どこから値を読むかが型の上でも明確です。
- **仕組みを 1 か所に集める**: 遅らせる仕組みは `Cached` クラスに任せ、この関数は入れ物を作るだけになっています。

## まとめ

- `cached` は、値を作る関数を入れ物に包んで、必要になったときに取り出せるようにする。
- 計算を使う直前まで後ろにずらせる。
- 戻り値の型で、取り出す属性 `value` を明示している。
