---
title: "判別できる型の共用体を、kind の値だけで絞り込む"
description: "valibot の isOfKind。オブジェクトの kind プロパティを見て、型を正確に絞り込む。TypeScript の型述語と、Extract による型の絞り込みを組み合わせている。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/isOfKind/isOfKind.ts
lines: [10, 15]
function: "isOfKind"
difficulty: 2
format: 2
tags: [型システム, ジェネリクス, 関数型]
---

## ひとことで

`isOfKind(kind, object)` は、オブジェクトの `kind` という印を見て、「これは指定した種類か」を判定する関数です。TypeScript では、判定が `true` のときに型も一緒に絞り込まれます。valibot の中で、スキーマの種類ごとに処理を分けるときに使われています。

```ts
const item = { kind: 'schema', name: 'user' } as const
if (isOfKind('schema', item)) {
  item.name // ここでは schema の型として扱われる
}
```

## コード

```ts:line-numbers=10
export function isOfKind<
  const TKind extends TObject['kind'],
  const TObject extends { kind: string },
>(kind: TKind, object: TObject): object is Extract<TObject, { kind: TKind }> {
  return object.kind === kind;
}
```

## 前提知識

- **判別可能な共用体（discriminated union）**: 「どの種類か」を表すプロパティ（ここでは `kind`）を持つ型の集まりです。`kind` の値を見れば、どの型か特定できます。
- **型述語 `object is 型`**: 関数の戻り値が `true` のとき、引数の型を指定の型に絞ると TypeScript に伝える書き方です。
- **`Extract<A, B>`**: 型 `A` の中から、`B` に代入できる部分だけを取り出す組み込みの型です。
- **ジェネリクス `<T>`**: 型を後から決められるように、型の変数を使う書き方です。`TKind` や `TObject` がそれにあたります。
- **`const` 型パラメータ**: 型引数を、ふつうより狭い型（`'schema'` のような文字列リテラル）として推論させる指定です。

## 何をしているか

### 1. 種類の名前を型として受け取る

```ts:line-numbers=11
  const TKind extends TObject['kind'],
  const TObject extends { kind: string },
```

`TObject` は `kind` を持つオブジェクトの型です。`TKind` は、その `kind` の中から選ばれた値です。`const` と付けることで、`'schema'` などの具体的な文字列の型として扱われます。

### 2. 値を比べる

```ts:line-numbers=14
  return object.kind === kind;
```

実行時には、ただ `kind` が一致するかを比べるだけです。判定そのものは単純です。

### 3. 型の絞り込みを戻り値の型で伝える

```ts:line-numbers=13
>(kind: TKind, object: TObject): object is Extract<TObject, { kind: TKind }> {
```

戻り値の型が `object is Extract<…>` になっているので、`true` のときは、`TObject` のうち `kind` が `TKind` と一致するものだけに型が絞られます。

## ここがすごい

- **比較と型の絞り込みを 1 つにまとめている**: 利用する側は `if (isOfKind(...))` と書くだけで、中で何を比べているかを気にせずに型の安全性を得られます。
- **`Extract` で候補の中から選ぶ**: 型を手で書き分けるのではなく、`Extract` が共用体の中から一致するものを自動で選びます。種類が増えても、この関数はそのまま使えます。
- **実行時のコストが小さい**: 型のための仕組みは、実行時にはほとんど残りません。`===` ひとつの判定になります。
- **型の情報を実行時に使う**: TypeScript の型は実行時には消えますが、`kind` という値はデータに残っています。その値と型を結びつけているのがこの関数の本質です。

## まとめ

- 判別できる共用体では、印（`kind`）の値で型を絞り込める。
- 型述語 `object is 型` を使うと、判定の結果を型にも反映できる。
- `Extract` を使うと、共用体の中から一致する型だけを取り出せる。
- `const` 型パラメータを付けると、文字列の値を正確な型として推論できる。
