---
title: "使い終わった下書きを無効化して、あとから触れなくする"
description: "immer の revokeScope。produce が終わったあと、その中で作った下書きをすべて無効にする。非同期処理で古い下書きを使うミスを、エラーで見つけられるようにしている。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/core/scope.ts
lines: [74, 79]
function: "revokeScope"
difficulty: 3
format: 2
tags: [メモリ管理, エラー処理, 防御的プログラミング]
---

## ひとことで

`revokeScope(scope)` は、`produce` の中で作られた下書きを、処理が終わったあとに使えないように「無効化（revoke）」する関数です。無効になった下書きを読み書きしようとすると、エラーになります。immer の下書きは、外に持ち出して後から使うと危険なので、その誤用を早く見つけるための仕組みです。

```ts
let saved
produce({ n: 1 }, (draft) => {
  saved = draft // 下書きを外に持ち出す（よくない使い方）
})
saved.n // TypeError: 無効化された下書き
```

## コード

::: code-group

```ts:line-numbers=74 [日本語訳]
export function revokeScope(scope: ImmerScope) {
	leaveScope(scope)
	scope.drafts_.forEach(revokeDraft)
	// 次の行の型エラーを無視する（@ts-ignore）
	scope.drafts_ = null
}
```

```ts:line-numbers=74 [原文]
export function revokeScope(scope: ImmerScope) {
	leaveScope(scope)
	scope.drafts_.forEach(revokeDraft)
	// @ts-ignore
	scope.drafts_ = null
}
```

:::

下書きを 1 つずつ無効にする `revokeDraft` も、同じファイルにあります。

```ts:line-numbers=90
function revokeDraft(draft: Drafted) {
	const state: ImmerState = draft[DRAFT_STATE]
	if (state.type_ === ArchType.Object || state.type_ === ArchType.Array)
		state.revoke_()
	else state.revoked_ = true
}
```

## 前提知識

- **`produce`**: immer の中心になる関数です。元のデータと、それを書き換える関数を渡すと、新しいデータを返します。
- **スコープ（scope）**: 1 回の `produce` の中で作られた下書きや状態をまとめて管理する入れ物です。`produce` が終わると、このスコープも終わります。
- **`Proxy`**: JavaScript で、オブジェクトへの読み書きを横取りできる仕組みです。immer の下書きは `Proxy` で作られています。`Proxy` を無効にすると、横取りのたびにエラーを投げられます。
- **`forEach`**: 配列の要素を 1 つずつ取り出して、関数を実行する組み込みのメソッドです。
- **`// @ts-ignore`**: 次の行の型エラーを無視する TypeScript の指示です。ここでは `drafts_` に `null` を入れるために使っています。

## 何をしているか

### 1. 作業中の場所を抜ける

```ts:line-numbers=75
	leaveScope(scope)
```

まず、このスコープが「いま使っているスコープ」だったら、その指定を外します。以後、新しい下書きがこの古いスコープに付いてしまわないようにするためです。

### 2. 作った下書きを全部無効にする

```ts:line-numbers=76
	scope.drafts_.forEach(revokeDraft)
```

このスコープに登録されている下書きを、1 つずつ `revokeDraft` に渡して無効にします。

### 3. 配列を空にして、参照を手放す

```ts:line-numbers=77
	// @ts-ignore
	scope.drafts_ = null
```

最後に `drafts_` を `null` にして、下書きへの参照を捨てます。下書きが不要になったときに、メモリが解放されやすくなります。

### 4. 下書きの種類で無効化の方法を変える

```ts:line-numbers=92
	if (state.type_ === ArchType.Object || state.type_ === ArchType.Array)
```

オブジェクトと配列は `revoke_()` という専用の関数で無効にします。`Map` や `Set` などは、フラグ `revoked_` を `true` にするだけです。

## ここがすごい

- **誤用を実行時のエラーで見つける**: 下書きを外に持ち出して使うと、古い値が静かに読めてしまうのではなく、はっきりエラーになります。バグが見つかりやすい設計です。
- **`Proxy` を取り消せる**: JavaScript の `Proxy` には、取り消す仕組みがあります。immer は、その機能を使って下書きを本当に使えなくしています。
- **種類ごとに処理を分ける**: 無効化の方法を 2 種類に分けることで、それぞれに合った最小の処理にしています。
- **参照を手放す**: 最後に `null` を入れることで、下書きが必要なくなった後もスコープが大量のデータを抱え続けない工夫になっています。

## まとめ

- 下書きは `produce` の中だけで使い、外へ持ち出さない。
- 無効化は、誤った使い方を早くエラーで知らせる仕組みになる。
- 不要になった参照は `null` にすると、メモリを解放しやすい。
- `// @ts-ignore` は、型の都合で止むを得ない場所だけに使う。
