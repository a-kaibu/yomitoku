---
title: "asserts で「ここから先は条件が成り立つ」と型に教える"
description: "条件が偽ならエラーを投げる invariant。戻り値の型を asserts condition にすることで、呼び出しのあとのコードで TypeScript が型を絞り込んでくれる。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/util/invariant.ts
lines: [65, 75]
function: "invariant"
difficulty: 2
tags: [型システム, エラー処理, 防御的プログラミング]
---

## ひとことで

`invariant(condition, message)` は、**条件が成り立っていなければエラーを投げる** 関数です。「ここでは絶対にこうなっているはず」という前提を、コードの中で確認するのに使います。

```ts
const user = users.find((u) => u.id === id) // User | undefined
invariant(user, 'ユーザーが見つかりません')
user.name // ← ここではもう undefined ではないと TypeScript がわかっている
```

実装は数行ですが、戻り値の型 **`asserts condition`** によって、TypeScript の型の絞り込みと連動するのが最大のポイントです。

## コード

```ts:line-numbers=65
export function invariant(condition: unknown, message: string | Error): asserts condition {
  if (condition) {
    return;
  }

  if (typeof message === 'string') {
    throw new Error(message);
  }

  throw message;
}
```

ファイルの上部には、第 2 引数が文字列の場合とエラーオブジェクトの場合の、2 つのオーバーロード（型だけの宣言）があります。

## 前提知識

- **型の絞り込み（narrowing）**: TypeScript は `if (x !== undefined) { … }` のような条件の中では、`x` の型から `undefined` を取り除いて扱います。
- **`asserts condition`**: 関数の戻り値の型として書ける特別な形です。「この関数が **普通に戻ってきたなら**、`condition` は真だった」と TypeScript に伝えます。呼び出したあとのコードでは、`if` の中と同じように型が絞り込まれます。
- **`unknown`**: 何が来るかわからない値の型です。どんな値でも条件として渡せます。
- **真偽値への変換（truthy / falsy）**: `if (condition)` では、`false`・`0`・`''`・`null`・`undefined`・`NaN` が偽、それ以外が真として扱われます。
- **`throw`**: エラーを投げて、関数の残りの処理を中断します。

## 何をしているか

### 1. 条件が真なら何もしない（66〜68 行目）

ほとんどの場合はここで終わります。

### 2. 偽なら投げる（70〜74 行目）

`message` が文字列なら、それを使って `Error` を作って投げます。エラーオブジェクトが渡されていれば、それをそのまま投げます。独自のエラークラス（`new NotFoundError(…)` など）を使いたい場合に対応しています。

## ここがすごい

- **実行時の確認と型の確認が 1 行で済む**: `asserts` がなければ、次のように書く必要があります。

  ```ts
  if (!user) throw new Error('ユーザーが見つかりません')
  ```

  `invariant` を使えば同じ意味が 1 行の関数呼び出しで書け、しかも TypeScript は `if` を書いたときと同じように、その後の `user` を `User` 型として扱ってくれます。
- **「起きないはず」を明示する**: `user!` のように `!` を付けて型チェックを黙らせる方法もありますが、それは実行時には何も確認しません。もし本当に `undefined` だったら、離れた場所で `Cannot read properties of undefined` という原因のわかりにくいエラーになります。`invariant` なら、前提が崩れた **その場所で**、意味のあるメッセージとともに止まります。
- **文字列とエラーの両方を受け付ける**: 手軽に使うなら文字列、エラーの種類で処理を分けたいならエラーオブジェクト、と使い分けられます。

## まとめ

- `asserts condition` を戻り値の型にすると、関数呼び出しで型を絞り込める。
- `!` で型チェックを黙らせるより、実行時にも確かめるほうが原因を追いやすい。
- 前提の確認は、崩れたその場所で意味のあるメッセージを出すのが大事。
