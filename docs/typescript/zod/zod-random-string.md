---
title: "文字を 1 つずつ選んで作るランダムな英小文字の列"
description: "指定した長さの、英小文字だけのランダムな文字列を作る randomString。Math.random で文字の位置を選び、長さの回数だけ連結する。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [487, 494]
function: "randomString"
difficulty: 1
format: 2
tags: [乱数, 文字列処理, イディオム]
---

## ひとことで

`randomString(length)` は、英小文字 `a` から `z` だけを使った、ランダムな文字列を返します。長さを省略すると 10 文字になります。

```ts
randomString()    // 例: 'qkzwhdtrmo'
randomString(4)   // 例: 'bxla'
```

テストで一意な名前を作るときや、一時的な ID を作るときなどに使います。毎回結果が変わるので、同じ値が欲しいときには使えません。

## コード

```ts:line-numbers=487
export function randomString(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
```

## 前提知識

- **`Math.random()`**: 0 以上 1 未満の小数をランダムに返します。
- **`Math.floor`**: 小数点以下を切り捨てます。`Math.floor(Math.random() * 26)` は 0 から 25 の整数になります。
- **文字列のインデックス**: `chars[3]` のように、文字列も位置で 1 文字を取り出せます。
- **`+=`**: 文字列の末尾に文字を連結します。

## 何をしているか

### 1. 使う文字の一覧を用意する

```ts:line-numbers=488
  const chars = "abcdefghijklmnopqrstuvwxyz";
```

英小文字を 26 文字並べた文字列です。この中から、ランダムに 1 文字ずつ選びます。

### 2. 長さの回数だけ 1 文字ずつ選ぶ

```ts:line-numbers=490
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
```

`i` を 0 から `length - 1` まで進め、毎回、乱数で選んだ位置の文字を末尾に足します。

`Math.random() * chars.length` は 0 以上 26 未満の小数なので、`Math.floor` で 0 から 25 の整数の位置が決まります。

### 3. 作った文字列を返す

```ts:line-numbers=493
  return str;
```

長さ分の文字がつながった文字列を返します。

## ここがすごい

- **使う文字を 1 か所に書く**: 範囲を変えたいときは、`chars` の文字列を書き換えるだけです。乱数の計算は、どの文字列にも同じ形で使えます。
- **文字の位置を乱数で決める**: 26 個の文字の中から、1 つの整数で位置を選ぶという単純な方法です。文字を 1 つずつ作るより、ずっと分かりやすくなっています。
- **暗号には向かないと分かる**: `Math.random` は暗号用の乱数ではありません。この関数は名前や ID の目安として使うもので、秘密の値には使わない、という使い分けが必要です。

## まとめ

- 文字列の中から乱数で位置を選ぶと、ランダムな文字列を作れる。
- 使う文字の集合を 1 か所に書くと、範囲の変更が簡単になる。
- `Math.random` は暗号用ではないので、用途に合わせて選ぶ。
