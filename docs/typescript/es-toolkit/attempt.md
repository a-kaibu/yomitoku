---
title: "try/catch を [エラー, 結果] の組に変える"
description: "関数を実行してエラーを投げる代わりに [エラー, 結果] の組を返す attempt。Go 言語風のエラー処理を、タプルの合併型で型安全に表している。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/util/attempt.ts
lines: [40, 46]
function: "attempt"
difficulty: 1
tags: [エラー処理, 型システム, 関数型]
---

## ひとことで

`attempt(func)` は、関数 `func` を実行して、**エラーを投げる代わりに `[エラー, 結果]` の組を返す** 関数です。

```ts
const [error, data] = attempt(() => JSON.parse(text))
if (error) {
  console.log('JSON が壊れています')
} else {
  console.log(data)
}
```

`try { … } catch { … }` を書かずに、戻り値を見るだけで成功と失敗を分けられます。Go 言語の `value, err := f()` に似たスタイルです。

## コード

```ts:line-numbers=40
export function attempt<T, E = unknown>(func: () => T): [null, T] | [E, null] {
  try {
    return [null, func()];
  } catch (error) {
    return [error as E, null];
  }
}
```

## 前提知識

- **`try { … } catch (error) { … }`**: `try` の中でエラーが投げられると、処理を中断して `catch` に移ります。`error` に投げられたものが入ります。
- **タプル型 `[null, T]`**: 「長さ 2 で、1 つ目が `null`、2 つ目が `T` 型の配列」という型です。
- **合併型 `A | B`**: 「`A` か `B` のどちらか」という型です。ここでは「成功の組」か「失敗の組」のどちらかを返します。
- **型引数の既定値 `E = unknown`**: 型引数 `E` を省略すると `unknown` になります。`attempt<SyntaxError>(…)` のように指定することもできます。
- **`error as E`**: `catch` で受け取る値は、TypeScript では `unknown`（何が投げられたかわからない）です。`as E` で指定された型として扱っています。
- **分割代入**: `const [error, data] = …` で、配列の 1 つ目と 2 つ目を別々の変数に取り出します。

## 何をしているか

### 成功したら `[null, 結果]`（41〜42 行目）

`func()` を実行して、問題なければ 1 つ目を `null`、2 つ目を結果にした組を返します。

### 失敗したら `[エラー, null]`（43〜44 行目）

エラーが投げられたら、1 つ目をエラー、2 つ目を `null` にした組を返します。

## ここがすごい

- **戻り値の型で「どちらか一方」を保証**: 戻り値の型は `[null, T] | [E, null]` です。`[T | null, E | null]` のような書き方と違い、「エラーと結果が両方ある」「両方ない」という状態は型の上で存在しません。
- **変数のスコープの問題を解決**: `try/catch` を使うと、結果を外で使うために `let data; try { data = f() } catch {}` のように、`try` の外で変数を先に宣言する必要があります。`attempt` なら `const` で 1 回宣言するだけです。
- **エラーを値として扱える**: エラーが戻り値になるので、配列にためたり、ほかの関数に渡したりできます。「エラーかどうかの判定を忘れる」と、`data` が `null` のまま使われるので、TypeScript が `null` チェックを促してくれます。
- **1 つ目がエラー**: 1 つ目をエラーにしているので、`if (error)` で最初に失敗を処理する流れが自然に書けます。Node.js の古いコールバック `(err, result) => …` とも同じ順番です。

## まとめ

- エラーを投げる処理を、`[エラー, 結果]` を返す形に包むと、`try/catch` なしで扱える。
- タプルの合併型を使うと、「どちらか一方だけがある」状態を型で表せる。
- `catch` の値は `unknown` なので、型を決めるならどこかで明示する必要がある。
