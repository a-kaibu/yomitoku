---
title: "辞書からキーを消し、必要なら表を縮める"
description: "dict:erase/2 は、キーとその値を辞書から取り除く。キーが無ければ辞書をそのまま返す。取り除いた後に、表が大きすぎれば縮める判断を行う。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/dict.erl
lines: [300, 304]
function: "dict:erase/2"
difficulty: 3
format: 2
tags: ["ハッシュ", "データ構造", "アルゴリズム"]
---
## ひとことで

`dict:erase/2` は、辞書からキーと、そのキーに対応する値を取り除きます。
キーが無いときは、辞書の内容は変わりません。取り除いた後は、表の大きさを見直して、必要なら縮めます。

## コード

```erlang:line-numbers=300
erase(Key, D0) ->
    Slot = get_slot(D0, Key),
    {D1,Dc} = on_bucket(fun (B0) -> erase_key(Key, B0) end,
			D0, Slot),
    maybe_contract(D1, Dc).
```

## 前提知識

- **スロットとバケット**: 辞書は、キーからスロットを求め、そのバケットに組を入れています。
- **`on_bucket/3`**: 指定のスロットのバケットに関数を適用し、新しい辞書と結果を返す補助関数です。
- **`erase_key/2`**: バケットからキーを取り除く関数です。取り除いた数 `Dc` を返します。
- **`maybe_contract/2`**: 要素が減った後に、表を縮めるかを判断する補助関数です。
- **`Dc`（減少数）**: 取り除いた組の数です。キーが無ければ 0、あれば 1 になります。

## 何をしているか

### 1. キーの場所を求める

```erlang:line-numbers=300
erase(Key, D0) ->
    Slot = get_slot(D0, Key),
```

`erase/2` は、まず `get_slot/2` でキーのスロットを求めます。

### 2. バケットから、キーを取り除く

```erlang:line-numbers=302
    {D1,Dc} = on_bucket(fun (B0) -> erase_key(Key, B0) end,
			D0, Slot),
```

`on_bucket/3` で、スロットのバケットに `erase_key/2` を適用します。結果は、新しい辞書 `D1` と、取り除いた数 `Dc` の組です。

### 3. 表を縮めるかを判断する

```erlang:line-numbers=304
    maybe_contract(D1, Dc).
```

`maybe_contract/2` に、減った数 `Dc` を渡します。`Dc` が 0 なら、何も減っていないので、表は変わりません。1 なら、要素が一つ減った分の判断を行います。

## ここがすごい

### 取り除いた数を、結果として運ぶ

消したかどうかを、別の関数で調べ直すことはしていません。
バケットの書き換えと同時に、取り除いた数 `Dc` が決まります。その値を次の段階に渡すので、表の縮小を判断する手間が一回で済みます。

### 無いキーは、辞書を変えない

キーが無いとき、`Dc` は 0 です。その場合、`maybe_contract` は表を変えません。
無いキーを消しても、辞書の中身も大きさも同じままです。呼び出し側は、キーの有無を気にせず消せます。

### 「消す」と「縮める」を分ける

キーを消す仕事は `erase_key` が、表を縮める判断は `maybe_contract` が担当します。
二つの仕事を分けているので、表の縮小の仕組みを変えても、消す処理には影響しません。

## まとめ

`dict:erase(a, dict:store(a, 1, dict:new()))` は、要素の無い辞書を返します。
`dict:erase(b, dict:store(a, 1, dict:new()))` は、`a` を持つ元の辞書を、そのまま返します。
