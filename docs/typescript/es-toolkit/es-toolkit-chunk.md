---
title: "配列を決まった長さの塊に切り分ける。最後の塊だけ短くなることがある"
description: "es-toolkit の chunk。配列を size 個ずつの塊に分ける。割り切れないときは最後の塊だけ短くなる。塊の数を先に計算して、配列を 1 回走査する。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/chunk.ts
lines: [24, 40]
function: "chunk"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 防御的プログラミング]
---

## ひとことで

`chunk(arr, size)` は、配列を `size` 個ずつの小さな配列（塊）に分ける関数です。たとえば `[1, 2, 3, 4, 5]` を 2 個ずつに分けると、`[[1, 2], [3, 4], [5]]` になります。割り切れないときは、最後の塊だけ短くなります。ページ送りや、一度に処理する件数を制限する場面でよく使われます。

```ts
chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
chunk(['a', 'b', 'c'], 3) // [['a', 'b', 'c']]
```

## コード

```ts:line-numbers=24
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('Size must be an integer greater than zero.');
  }

  const chunkLength = Math.ceil(arr.length / size);
  const result: T[][] = Array(chunkLength);

  for (let index = 0; index < chunkLength; index++) {
    const start = index * size;
    const end = start + size;

    result[index] = arr.slice(start, end);
  }

  return result;
}
```

## 前提知識

- **塊（チャンク）**: 大きな配列を、一定の大きさに区切った小さな配列のことです。
- **`Math.ceil`**: 小数を切り上げる組み込み関数です。`Math.ceil(5 / 2)` は `3` になります。割り切れないときに、塊が 1 つ余ることを表します。
- **`Array(n)`**: 長さ `n` の、空の配列を作ります。先に長さを決めておくと、後から要素を入れやすくなります。
- **`slice(start, end)`**: 配列の一部をコピーして、新しい配列を作ります。`end` は含まれない位置です。
- **例外（`throw`）**: 条件に合わないときにエラーを投げて、処理を止める仕組みです。

## 何をしているか

### 1. 引数が正しいかを確かめる

```ts:line-numbers=25
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('Size must be an integer greater than zero.');
  }
```

`size` は、整数で 1 以上でなければなりません。`0` や `2.5` を渡すと、塊の大きさが定まらないので、エラーにします。

### 2. 塊の数を先に決める

```ts:line-numbers=29
  const chunkLength = Math.ceil(arr.length / size);
  const result: T[][] = Array(chunkLength);
```

配列の長さを `size` で割り、切り上げた数が塊の数です。割り切れなかった分も、1 つの塊として数えます。結果の配列は、この長さで先に確保しておきます。

### 3. 塊ごとに切り出す

```ts:line-numbers=32
  for (let index = 0; index < chunkLength; index++) {
    const start = index * size;
    const end = start + size;

    result[index] = arr.slice(start, end);
  }
```

塊の番号 `index` に `size` を掛けると、その塊の開始位置になります。終わりは開始から `size` 進んだ位置です。`slice` は配列の端を超えても安全なので、最後の塊は自然に短くなります。

## ここがすごい

- **塊の数を先に計算する**: 途中で配列に要素を追加していくと、何度も領域を広げ直すことになります。最初に長さを決めておくと、無駄な再確保を避けられます。
- **端の処理を `slice` に任せる**: 最後の塊のために、特別な場合分けを書いていません。`slice` は範囲外の終わりを、配列の末尾として扱うので、同じ式で済みます。
- **入力の検査が明確**: `Number.isInteger` で小数を、`size <= 0` で 0 以下を、まとめて弾いています。エラーの文面も、何が問題かを示しています。
- **配列を 1 回だけ走査**: 塊の数を数える処理と、切り出す処理が、1 本のループで行われます。読みやすく、速さも保たれます。

## まとめ

- 配列を塊に分けるときは、まず塊の数を `Math.ceil` で求める。
- 割り切れない場合も、最後の塊は `slice` が自然に短く切り出してくれる。
- 入力の検査（整数で 1 以上か）を最初に行うと、後の計算が安全になる。
- 結果の配列を先に確保しておくと、途中での再確保を防げる。
