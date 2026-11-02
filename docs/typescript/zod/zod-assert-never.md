---
title: "到達しないはずの分岐に来たら、例外を投げて知らせる"
description: "zod の assertNever は、型の上で到達しないはずの値が来たときに例外を投げる。引数の型を never にして、網羅性の確認と実行時の保険を両立させている。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [271, 273]
function: "assertNever"
difficulty: 1
format: 2
tags: [エラー処理, 型システム]
---

## ひとことで

`assertNever(_x)` は、型の上では来ないはずの値が実行時に届いたときに、例外を投げて知らせる関数です。`switch` 文の最後に置いて、すべての場合が書かれているかを確かめる目的で使われます。

```ts
function f(kind: 'a' | 'b') {
  switch (kind) {
    case 'a': return 1;
    case 'b': return 2;
    default: return assertNever(kind); // 'a' と 'b' 以外は型の上で来ない
  }
}
```

## コード

```ts:line-numbers=271
export function assertNever(_x: never): never {
  throw new Error("Unexpected value in exhaustive check");
}
```

## 前提知識

- **`never` 型**: 値が決して存在しない、という意味の型です。どの型にも代入できるので、「ここに来てはいけない」を型の上で表せます。
- **網羅性の確認**: 列挙型や共用体のすべての場合を、`switch` などで扱えているかを確かめることです。
- **例外（throw）**: 処理を途中で止めて、エラーを上の呼び出し元に伝える仕組みです。

## 何をしているか

### 1. 型で来ない値を示す

```ts:line-numbers=271
export function assertNever(_x: never): never {
  throw new Error("Unexpected value in exhaustive check");
}
```

引数の型が `never` なので、型の上では、この関数に値を渡せるのは「すべての場合を処理し終えたあと」だけです。もし新しい場合が増えて分岐の書き忘れがあると、ここに値が残り、型の検査で気づけます。

### 2. 実行時には例外を投げる

関数の本体は `throw` だけです。型の検査をすり抜けて値が届いたときに、「想定外の値」として処理を止め、問題を見つけやすくします。戻り値の型も `never` で、この関数が正常に戻らないことを示しています。

## ここがすごい

- **型と実行の両方で守る**: 型の検査で書き忘れを見つけ、それでも漏れた場合は実行時の例外で止めます。
- **戻り値が never**: 関数が値を返さないことを型で表すので、呼び出し側も後続の処理を正しく読めます。
- **引数を使わない**: 引数名の先頭の `_` は、値を使わないという意図を示します。中身の値そのものは関係なく、「来たこと」だけが問題です。

## まとめ

- `assertNever` は、型の上で来ないはずの値が届いたときに例外を投げる。
- 引数を `never` にして、分岐の書き忘れを型の検査で見つける。
- 実行時にも例外で止め、想定外の値を隠さない。
