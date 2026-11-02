---
title: "検証を途中で止めるべきかを、エラーの印で判断する"
description: "zod の aborted は、検証のエラーの中に「ここで止める」印があるかを調べる。continue が true でない issue が 1 つでもあれば、検証を打ち切ったとみなす。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [904, 912]
function: "aborted"
difficulty: 2
format: 2
tags: [エラー処理, 防御的プログラミング, 型システム]
---

## ひとことで

`aborted(x, startIndex)` は、検証の途中結果（`ParsePayload`）が「もう続けられない状態」かを判定する関数です。`aborted` が立っているか、エラー（issue）の中に `continue` が `true` でないものがあれば、`true` を返します。zod は、この判定を見て、後続の検査を飛ばします。

```ts
aborted({ aborted: false, issues: [] })                     // false（まだ続けられる）
aborted({ aborted: false, issues: [{ continue: true }] })   // false（続けてよいエラー）
aborted({ aborted: false, issues: [{ continue: false }] })  // true（止める）
```

## コード

```ts:line-numbers=904
export function aborted(x: schemas.ParsePayload, startIndex = 0): boolean {
  if (x.aborted === true) return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
```

## 前提知識

- **検証（パース）**: 入力の値が、スキーマの形に合っているかを確かめる作業です。zod の中心になる処理です。
- **issue（イシュー）**: 検証で見つかった問題の情報です。どこで、何が問題だったかを持ちます。
- **`continue`**: issue の中の印です。`true` なら「後の検査も続けてよい」、`false` なら「ここで止める」という意味で使われます。`undefined` の場合もあります。
- **`?.`（オプショナルチェーン）**: `x.issues[i]?.continue` は、`issues[i]` が無いときに `undefined` を返して止まる書き方です。
- **`startIndex`**: 調べ始める位置です。途中から調べ直すときに使います。

## 何をしているか

### 1. すでに打ち切られていれば真

```ts:line-numbers=905
  if (x.aborted === true) return true;
```

`x.aborted` が `true` なら、もう検証は止まっています。すぐ `true` を返します。

### 2. continue が true でない issue を探す

```ts:line-numbers=906
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
```

`startIndex` から、issue を 1 つずつ調べます。`continue` が `true` でないもの（`false` か `undefined`）が 1 つでもあれば、止めるべきなので `true` を返します。

### 3. 最後まで問題がなければ偽

```ts:line-numbers=912
}
```

全部の issue が `continue === true` なら、検証は続けてよいので `false` を返します。

## ここがすごい

- **止めるかどうかを 1 つの印で決める**: 検証を続けるかは、issue の `continue` 印だけで決まります。複雑な状態管理がいりません。
- **`every` ではなく `for` で打ち切る**: 止める条件が 1 つ見つかった時点で返すので、残りの issue を調べる必要がありません。
- **`startIndex` で途中から調べられる**: 既に調べた部分を飛ばして、新しく追加された issue だけを確かめられます。
- **名前の意味が明確**: `aborted` という名前は、「検証が中断された」という状態をそのまま表しています。

## まとめ

- 検証の途中で続けるかは、issue の印（`continue`）で決められる。
- 1 つでも「止める」印があれば、全体として止めるべきと判断できる。
- 途中から調べ直せるように、開始位置を引数にしておくと便利。
- 結果が決まった時点で返すと、無駄な確認を省ける。
