---
title: "開発時は詳しく、本番では短く。エラー関数 die の切り替え"
description: "immer の die 関数。開発環境ではエラーの説明文を出し、本番ビルドでは番号だけのごく短いメッセージにして、配布するコードを小さくしている。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/errors.ts
lines: [41, 50]
function: "die"
difficulty: 2
format: 2
tags: [エラー処理, 最適化, ログ]
---

## ひとことで

`die(error, ...args)` は、immer でエラーを投げるための関数です。開発中（`NODE_ENV` が `production` 以外のとき）は、番号に対応する説明の文章を組み立てて投げます。本番ビルドでは、説明文を入れずに番号だけを書いた短いメッセージにします。

```ts
die(2) // 開発時: "[Immer] This object has been frozen and should not be mutated"
       // 本番時: "[Immer] minified error nr: 2. Full error at: ..."
```

## コード

```ts:line-numbers=41
export function die(error: number, ...args: any[]): never {
	if (process.env.NODE_ENV !== "production") {
		const e = errors[error]
		const msg = isFunction(e) ? e.apply(null, args as any) : e
		throw new Error(`[Immer] ${msg}`)
	}
	throw new Error(
		`[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
	)
}
```

説明文の表は、同じファイルの前半にあります。

```ts:line-numbers=3
export const errors =
	process.env.NODE_ENV !== "production"
		? [
```

## 前提知識

- **`process.env.NODE_ENV`**: 実行環境を表す値です。開発中は `"development"`、本番のビルドは `"production"` になることが多いです。ビルドツールがこの値で、不要なコードを取り除きます。
- **`never` 型**: 値を返さずに終わる（必ず例外を投げる）ことを示す型です。`die` の呼び出しの後のコードは、TypeScript から到達しないと判断されます。
- **可変長引数 `...args`**: 引数をいくつでも受け取る書き方です。配列として `args` に入ります。
- **`throw`**: エラーを投げて、処理を中断する文です。
- **`isFunction(e) ? … : e`**: 説明文が関数（引数を使って文章を作る）か、ただの文字列かを見分けて、どちらでも扱えるようにしています。

## 何をしているか

### 1. 開発中は説明文を組み立てる

```ts:line-numbers=42
	if (process.env.NODE_ENV !== "production") {
```

開発中かどうかで分岐します。本番以外では、説明文の表から文章を取り出します。

```ts:line-numbers=44
		const msg = isFunction(e) ? e.apply(null, args as any) : e
```

表の項目が関数なら、渡された引数で文章を作ります。文字列ならそのまま使います。

```ts:line-numbers=45
		throw new Error(`[Immer] ${msg}`)
```

前に `[Immer]` を付けて、エラーを投げます。

### 2. 本番では番号だけを書く

```ts:line-numbers=47
	throw new Error(
		`[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
	)
```

本番では説明文の表を使いません。番号と、詳しい説明へのリンクだけを書きます。

## ここがすごい

- **本番の文字数を減らす**: 説明文の表は、本番のビルドでは `errors` が空の配列になるので、ビルドツールがそこを取り除けます。配布されるコードが軽くなります。
- **番号で管理する**: エラーの種類を番号で表すと、同じ内容を何度書かずに済みます。説明文は開発時だけ読めれば十分という割り切りです。
- **説明へのリンク**: 本番のメッセージには、詳しい説明へのリンクが入ります。短くしても、調べる道は残しています。
- **同じ関数で両方を扱う**: 呼び出し側は `die(2)` と書くだけで、環境によって出る文章が自動で変わります。

## まとめ

- エラーメッセージの文章は、開発時だけ詳しく出す。
- 本番では番号とリンクだけにすると、配布されるコードを小さくできる。
- `never` 型を返すと、エラーで終わる関数だと型で伝えられる。
- 環境の値（`NODE_ENV`）で分岐したコードは、ビルド時に不要な部分が消える。
