---
title: "下書きの元になったオブジェクトを取り出す"
description: "immer の original。下書きから、その元になった値（ベース）を取り出す。下書きでない値を渡すとエラーにする。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [83, 86]
function: "original"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング, エラー処理]
---

## ひとことで

`original(value)` は、下書き（draft）から、その元になった値を取り出す関数です。下書きには、書き換えの途中の内容が入っています。`original` を使うと、書き換えが始まる前の、元のオブジェクトが得られます。下書きでない値を渡すと、エラーになります。

```ts
const base = { n: 1 }
produce(base, (draft) => {
  draft.n = 2
  original(draft)  // { n: 1 }（書き換える前の元の値）
})
```

## コード

```ts:line-numbers=83
export function original(value: Draft<any>): any {
	if (!isDraft(value)) die(15, value)
	return value[DRAFT_STATE].base_
}
```

## 前提知識

- **`produce`**: 元の値と、それを書き換える関数を受け取り、新しい値を返す immer の関数です。書き換えは、下書きに対して行われます。
- **ベース（base）**: 下書きが元にしているオブジェクトです。書き換えが無ければ、このベースがそのまま結果になります。
- **`die`**: immer の内部でエラーを投げる関数です。番号で、どんなエラーかを示します。
- **`DRAFT_STATE`**: 下書きに付いている状態の印です。下書きかどうかを、この印の有無で判定します。

## 何をしているか

### 1. 下書きかを確かめる

```ts:line-numbers=84
	if (!isDraft(value)) die(15, value)
```

`isDraft` で、渡された値が下書きかを調べます。下書きでなければ、`die(15)` でエラーを投げます。

### 2. 元の値（ベース）を返す

```ts:line-numbers=85
	return value[DRAFT_STATE].base_
```

下書きの状態に覚えてある `base_` を返します。これが、書き換えの前の元の値です。

## ここがすごい

- **下書きの状態を利用する**: 元の値は、下書きの内部の状態として覚えてあります。`original` は、その場所を読むだけなので、とても単純です。
- **誤用を早く知らせる**: 下書きでない値を渡すと、その場でエラーになります。間違った値に対する処理が、静かに進むことを防ぎます。
- **型で結果を示す**: 戻り値の型は元の型 `T` です。下書きの型から、元の型に戻すことが、型の上でも分かります。
- **変更を見る道具**: 書き換えの前後の値を比べたいときに、この関数で元の値を取り出して比べられます。

## まとめ

- 下書きの元の値は、下書きの内部の状態として保持されている。
- 下書きかどうかを確かめてから取り出すと、誤用を早く見つけられる。
- 元の値を取り出すと、書き換えの前後を比べる処理が書ける。
- 型の上でも、下書きの型と元の型の関係を示すとよい。
