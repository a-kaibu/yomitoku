---
title: "文字列・配列・オブジェクトの class を 1 つの文字列にそろえる"
description: "Vue の class 属性の値を、文字列・配列・入れ子の配列・真偽値つきのオブジェクトのどれからでも、空白区切りの 1 つの文字列にする normalizeClass。再帰で入れ子をたどる。"
language: typescript
project: "Vue.js"
repo: https://github.com/vuejs/core
license: MIT
copyright: "Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors"
commit: "24c9d0bffb2299635b8112a978d74a38723aaa10"
file: packages/shared/src/normalizeProp.ts
lines: [65, 84]
function: "normalizeClass"
difficulty: 2
format: 2
tags: [再帰, 型システム, イディオム]
---

## ひとことで

`normalizeClass(value)` は、テンプレートに書かれた `class` の値を、**空白で区切った 1 つの文字列** に変換します。

```ts
normalizeClass(['a', { b: true, c: false }, ['d']]) // 'a b d'
```

Vue では `class` に文字列だけでなく、配列やオブジェクトも書けます。どの形で書かれても、最後は同じ文字列にそろえるのが、この関数の役割です。

## コード

```ts:line-numbers=65
export function normalizeClass(value: unknown): string {
  let res = ''
  if (isString(value)) {
    res = value
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i])
      if (normalized) {
        res += normalized + ' '
      }
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + ' '
      }
    }
  }
  return res.trim()
}
```

## 前提知識

- **再帰**: 関数が自分自身を呼ぶことです。配列の中に配列があっても、同じ処理で最後まで降りていけます。
- **`for ... in`**: オブジェクトのキーを 1 つずつ取り出します。
- **真偽値の判定**: `if (value[name])` は、値が `true` や空でない文字列なら真、`false` や `''` なら偽として扱います。
- **`trim()`**: 文字列の前後の空白を取り除きます。

## 何をしているか

### 1. 文字列ならそのまま使う

```ts:line-numbers=67
  if (isString(value)) {
    res = value
```

`class="a b"` のように文字列で書かれていたら、それをそのまま結果にします。

### 2. 配列なら 1 つずつ変換して連結する

```ts:line-numbers=69
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i])
      if (normalized) {
        res += normalized + ' '
      }
    }
```

配列の各要素を、再帰で `normalizeClass` に通します。結果が空でなければ、後ろに空白を付けて `res` に足していきます。

`['a', ['b']]` なら、`'a '` と `'b '` が連結されて `'a b '` になります。

### 3. オブジェクトなら真のキーだけを使う

```ts:line-numbers=76
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + ' '
      }
    }
  }
```

キーの値が真のものだけ、キー名を追加します。`{ b: true, c: false }` なら `b` だけが残ります。

### 4. 最後に前後の空白を取り除く

```ts:line-numbers=83
  return res.trim()
```

手順 2 と 3 では末尾に空白を付けていたので、最後に `trim()` で取り除きます。

## ここがすごい

- **同じ関数を再帰で呼ぶだけ**: 配列の中の要素が配列やオブジェクトでも、特別な分岐を書かずに同じ処理で済みます。どこまで入れ子になっていても、最後は文字列になります。
- **空の値は自然に消える**: 偽の値や空文字列は、`if` で判定されて結果に入りません。`class` の値を作るときに、「条件が成り立つものだけ使う」という書き方がそのまま動きます。
- **末尾の空白は最後にまとめて消す**: 連結のたびに空白の有無を気にせず、途中は `' '` を付けるだけにして、最後の `trim()` で一度に片付けています。

## まとめ

- 入れ子になった値は、同じ関数を再帰で呼ぶと 1 つの形にまとめられる。
- 条件付きの値は、真のものだけを残すとテンプレートのように書ける。
- 連結の区切りは途中で付け、最後に `trim()` で取り除くと、端の処理が単純になる。
