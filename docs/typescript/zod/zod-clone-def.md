---
title: "スキーマの定義を、複製して取り出す"
description: "zod の cloneDef は、スキーマが持つ定義（def）を複製して返す。元の定義を直接書き換えずに済むように、定義を別のオブジェクトに写す小さな関数。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [465, 467]
function: "cloneDef"
difficulty: 1
format: 2
tags: [イディオム, データ構造]
---

## ひとことで

`cloneDef(schema)` は、スキーマの中にある定義（`def`）の複製を返す関数です。元の定義を書き換えずに、別の場所で同じ定義を使えるようにします。

```ts
const copy = cloneDef(schema)
// copy は schema の定義と同じ内容の、別のオブジェクト
```

## コード

```ts:line-numbers=465
export function cloneDef(schema: schemas.$ZodType): any {
  return mergeDefs(schema._zod.def);
}
```

## 前提知識

- **スキーマ**: zod で、値の形を表す部品のことです。内部には、その形を書いた定義（`def`）を持っています。
- **定義（def）**: スキーマの種類や条件などをまとめたオブジェクトです。
- **`mergeDefs`**: 同じファイルの中にある関数で、定義を新しい 1 つのオブジェクトにまとめて写します。

## 何をしているか

### 1. 定義を取り出して複製する

```ts:line-numbers=466
  return mergeDefs(schema._zod.def);
```

スキーマの内部の定義 `schema._zod.def` を取り出し、`mergeDefs` に渡します。`mergeDefs` が新しいオブジェクトに写すので、元の定義は残ったままです。

## ここがすごい

- **元の定義を守る**: 複製を返すので、呼び出し側が自由に変えても元のスキーマは壊れません。
- **複製の方法を 1 か所に集める**: 定義をどう写すかは `mergeDefs` に任せ、この関数は取り出すだけです。
- **名前が役割を表す**: `cloneDef` と読めば、何をするかが分かります。

## まとめ

- `cloneDef` は、スキーマの定義を複製して返す。
- 定義の写し方は `mergeDefs` に任せ、この関数は取り出しだけを行う。
- 元のスキーマの定義は書き換えられずに残る。
