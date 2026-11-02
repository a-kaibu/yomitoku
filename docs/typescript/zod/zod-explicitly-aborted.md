---
title: "処理が明示的に中断されたかを、問題の一覧から調べる"
description: "zod の explicitlyAborted は、検証の結果が明示的に中断されたかを調べる。全体の aborted の印と、途中の問題の continue の印を、開始位置から順に確かめる。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [915, 923]
function: "explicitlyAborted"
difficulty: 2
format: 2
tags: [エラー処理, 防御的プログラミング]
---

## ひとことで

`explicitlyAborted(x, startIndex)` は、検証の途中結果 `x` が、「ここで続けない」と明示的に止められているかを調べる関数です。全体が中断されているか、途中の問題に「続けない」印があるかを確かめます。

```ts
explicitlyAborted({ aborted: true, issues: [] })  // true
explicitlyAborted({ issues: [{ continue: false }] })  // true
explicitlyAborted({ issues: [] })  // false
```

## コード

```ts:line-numbers=915
export function explicitlyAborted(x: schemas.ParsePayload, startIndex = 0): boolean {
  if (x.aborted === true) return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
```

## 前提知識

- **問題（issue）の一覧**: 検証で見つかった問題を、配列にためておく仕組みです。
- **`continue` の印**: 問題ごとに、後続の検証を続けてよいかを示す値です。`false` のときは、その時点で止めるという意味です。
- **開始位置**: 配列のどの位置から調べるかを決める数です。途中から調べ直すときに使います。

## 何をしているか

### 1. 全体の中断の印を確かめる

```ts:line-numbers=916
  if (x.aborted === true) return true;
```

検証全体に `aborted` の印が立っていれば、すぐに `true` を返します。

### 2. 途中の問題を順に確かめる

```ts:line-numbers=917
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
```

`startIndex` から問題を順に見て、どれか一つでも `continue` が `false` なら `true` を返します。

### 3. どちらでもなければ偽

```ts:line-numbers=922
  return false;
```

全体の印も、個々の印も無ければ、明示的な中断はなかったと判断します。

## ここがすごい

- **早く答えを返す**: 印を見つけた時点で `return` するので、残りの問題は調べずに済みます。
- **開始位置を指定できる**: `startIndex` により、一部だけを見直す場面にも使えます。
- **オプショナルチェーン**: `x.issues[i]?.continue` により、途中の値が無くても安全に判定できます。

## まとめ

- `explicitlyAborted` は、検証が明示的に中断されたかを調べる。
- 全体の印を先に確かめ、次に各問題の `continue` を順に見る。
- 見つけた時点で `true` を返し、無駄な確認をしない。
