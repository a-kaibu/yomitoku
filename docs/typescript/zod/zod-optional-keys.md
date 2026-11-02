---
title: "省略できるキーだけを、スキーマの印から選び出す"
description: "zod の optionalKeys は、スキーマの各キーの内部の印を見て、入力の時点で省略できるキーの一覧を返す。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [726, 730]
function: "optionalKeys"
difficulty: 2
format: 2
tags: [型システム, イテレータ, 防御的プログラミング]
---

## ひとことで

`optionalKeys(shape)` は、オブジェクトのスキーマ（形の定義）の中から、省略してもよいキーの名前だけを配列にして返す関数です。zod は、スキーマに書かれたキーが入力に無くても許されるかどうかを、内部の印で管理しています。この関数は、その印を読んで一覧を作ります。

```ts
// shape に name（必須）と age（省略可）があるなら
optionalKeys(shape) // ['age']
```

## コード

```ts:line-numbers=726
export function optionalKeys(shape: schemas.$ZodShape): string[] {
  return Object.keys(shape).filter((k) => {
    return shape[k]!._zod.optin !== undefined && shape[k]!._zod.optout === "optional";
  });
}
```

## 前提知識

- **スキーマ（shape）**: オブジェクトの形を表す定義です。キーごとに、どんな値を受け付けるかを書きます。
- **`Object.keys`**: オブジェクトのキーの名前を、配列にして返す組み込み関数です。
- **`filter`**: 配列の要素のうち、条件を満たすものだけを集めて、新しい配列を作るメソッドです。
- **`!`（非 null の表明）**: `shape[k]!` の `!` は、そこが `undefined` ではないと開発者が保証する書き方です。
- **`_zod.optin` と `_zod.optout`**: zod の内部で、各スキーマが「入力で省略できるか」「出力で省略されるか」を表すために持つ印です。名前から読み取れる範囲の説明です。

## 何をしているか

### 1. キーの一覧を取り出す

```ts:line-numbers=727
  return Object.keys(shape).filter((k) => {
```

`Object.keys(shape)` で、スキーマのキーを全部取り出し、順に `filter` にかけます。

### 2. 省略の印を調べる

```ts:line-numbers=728
    return shape[k]!._zod.optin !== undefined && shape[k]!._zod.optout === "optional";
  });
```

キーに対応するスキーマの `optin` が設定されていて、かつ `optout` が `"optional"` なら、そのキーは省略可能です。両方の条件を満たすものだけが残ります。

## ここがすごい

- **印を読むだけで判定する**: 値が本当に入っているかは見ずに、スキーマの定義だけで答えが出ます。実際のデータを検査する前に、構造を先に決められます。
- **`filter` で一覧を作る**: 条件を 1 か所に書くだけで、省略可能なキーが全部集まります。ループの中で状態を管理する必要がありません。
- **型の情報を実行時に使う**: TypeScript の型は実行時には消えますが、zod は印を値として持つことで、それを実行時にも使えるようにしています。
- **結果が配列**: 名前の一覧なので、後で別の処理（例えば、必須かどうかの表示など）に、そのまま渡せます。

## まとめ

- スキーマの定義は、キーごとの印として内部に持たれている。
- 印を読めば、データを見ずに省略可能なキーを求められる。
- `filter` と `Object.keys` を組み合わせると、キーの一覧を短く絞り込める。
- 定義の情報を実行時の値として残すと、後の処理で使いやすくなる。
