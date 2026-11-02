---
title: "検証結果をコピーして、前の結果を汚さないようにする"
description: "valibot の _cloneDataset。検証の結果に入っているエラーの path 配列を、毎回新しく作り直す。親のスキーマがパスを書き足しても、元の結果が増え続けないようにしている。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/_cloneDataset/_cloneDataset.ts
lines: [16, 34]
function: "_cloneDataset"
difficulty: 3
format: 2
tags: [メモリ管理, 防御的プログラミング, 型システム]
---

## ひとことで

`_cloneDataset(dataset)` は、検証の結果（`dataset`）を、中身をコピーした新しい結果として作り直す関数です。エラー（issue）の `path`（場所）の配列まで新しく作るのが特徴です。こうしておくと、親のスキーマが場所を書き足しても、もとの結果に余計な場所が積み重ならずに済みます。

```ts
const first = _cloneDataset(result)
// first.issues[0].path を書き換えても、result の path は変わらない
```

## コード

::: code-group

```ts:line-numbers=16 [日本語訳]
export function _cloneDataset<TValue, TIssue extends BaseIssue<unknown>>(
  dataset: OutputDataset<TValue, TIssue>
): OutputDataset<TValue, TIssue> {
  // 性能のため、スプレッド構文ではなく既知のプロパティを直接代入する
  // 実行時の性能のため、スプレッド構文は使わない。
  return {
    typed: dataset.typed,
    value: dataset.value,
    // 親のスキーマと forward メソッドは、受け取った issue に path の要素を足す。
    // そのため issue と path 配列を複製し、同じ issue に何度も適用されないようにする。
    // この変更が、次の実行でも同じ issue に積み重ならないようにする。
    // 毎回複製することで、その状態を保つ。
    // @ts-expect-error 配列の map は、空でないタプル型を保持しない
    issues: dataset.issues?.map((issue) => ({
      ...issue,
      path: issue.path && [...issue.path],
    })),
  };
}
```

```ts:line-numbers=16 [原文]
export function _cloneDataset<TValue, TIssue extends BaseIssue<unknown>>(
  dataset: OutputDataset<TValue, TIssue>
): OutputDataset<TValue, TIssue> {
  // Hint: We assign the known dataset properties directly instead of using the
  // spread operator for better runtime performance.
  return {
    typed: dataset.typed,
    value: dataset.value,
    // Hint: Parent schemas and the `forward` method add path items to the
    // issues they receive. We therefore clone each issue and its `path` array,
    // so that these mutations are not applied to the same issue again on every
    // following run.
    // @ts-expect-error Array.map does not preserve the non-empty tuple type
    issues: dataset.issues?.map((issue) => ({
      ...issue,
      path: issue.path && [...issue.path],
    })),
  };
}
```

:::

## 前提知識

- **dataset（データセット）**: valibot の検証結果をまとめた入れ物です。`typed`（型が合っているか）、`value`（値）、`issues`（エラーの一覧）を持ちます。
- **issue と path**: エラー 1 件の情報が issue で、その中の `path` は、データのどこで起きたかを表す配列です。
- **スプレッド構文 `...issue`**: オブジェクトのプロパティを全部コピーして、新しいオブジェクトに入れる書き方です。
- **`?.`（オプショナルチェーン）**: 左が `null` か `undefined` なら、そこで止めて `undefined` を返す書き方です。`dataset.issues?.map` は、`issues` が無いときに安全に止まります。
- **`@ts-expect-error`**: 次の行に型エラーがあることを宣言して、警告を消す指示です。型の限界を明示するために使われます。

## 何をしているか

### 1. 型と値はそのまま渡す

```ts:line-numbers=21
  return {
    typed: dataset.typed,
    value: dataset.value,
```

`typed` と `value` は、そのまま新しい結果に入れます。これらは検証の途中で書き換わらないので、コピーするだけで済みます。

### 2. issue を 1 つずつ作り直す

```ts:line-numbers=29
    issues: dataset.issues?.map((issue) => ({
      ...issue,
      path: issue.path && [...issue.path],
    })),
```

`issues` の各要素について、中身を広げてコピーし、`path` だけは配列を新しく作り直します。`issue.path && …` は、`path` が無いときは何もしないためです。

## ここがすごい

- **書き足しによる汚染を防ぐ**: 親のスキーマは、子が返した issue に `path` の要素を足します。同じ結果を何度も使うと、同じ要素が繰り返し積み上がってしまいます。複製すれば、それを防げます。
- **必要な部分だけを複製**: 深いコピーをすると全体が遅くなります。`issue` と `path` だけを複製し、中の値は共有するので、速さと安全性をつり合わせています。
- **コメントに性能の理由がある**: スプレッド構文を使わずに、`typed` と `value` を直接代入するのは、実行時の速さのためだと明記されています。
- **型の限界を正直に書く**: `@ts-expect-error` で、TypeScript の型推論が届かない部分を明示しています。隠さずに説明する書き方です。

## まとめ

- 検証の結果は、必要なところだけを複製すると安全に使い回せる。
- 配列を書き換える処理は、元のデータを汚さないように、複製してから行う。
- 深いコピーを避けて、変わる部分だけを作り直すと、速さを保てる。
- 型の限界は `@ts-expect-error` などで明示し、理由をコメントに残す。
