---
title: "マップから、指定したキーだけを取り出して新しいマップにする"
description: "maps:with/2 は、キーのリストのうち、マップにあるキーだけを選んで、新しいマップを作る。無いキーは飛ばし、エラーにはしない。maps:without/2 の反対の絞り込み。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [1165, 1175]
function: "maps:with/2"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`maps:with/2` は、キーのリストを受け取り、そのうちマップにあるキーの組だけを取り出した、新しいマップを返します。
キーがマップに無くても、エラーにはなりません。その分は、単に結果に入らないだけです。`maps:without/2` と、ちょうど反対の絞り込みです。

## コード

```erlang:line-numbers=1165
with(Ks,Map1) when is_list(Ks), is_map(Map1) ->
    maps:from_list(with_1(Ks, Map1));
with(Ks,M) ->
    error_with_info(error_type(M), [Ks,M]).

with_1([K|Ks], Map) ->
    case Map of
        #{K := V} -> [{K,V}|with_1(Ks, Map)];
        #{} -> with_1(Ks, Map)
    end;
with_1([], _Map) -> [].
```

## 前提知識

- **マップ**: キーと値の組を持つデータ構造です。キーで値を素早く引けます。
- **`#{K := V}` パターン**: マップに `K` というキーがあるときだけ、マッチして `V` に値を受けます。
- **`#{}` パターン**: どんなマップにもマッチします。ここでは、キーが無かった場合の節として使われています。
- **`maps:from_list/1`**: 組のリストから、マップを作ります。

## 何をしているか

### 1. 入口で、引数の形を確かめる

```erlang:line-numbers=1165
with(Ks,Map1) when is_list(Ks), is_map(Map1) ->
    maps:from_list(with_1(Ks, Map1));
```

`with/2` は、キーのリストとマップの形を確かめてから、`with_1/2` に仕事を渡し、結果の組のリストからマップを作ります。
形が違えば、二つ目の節で、型のエラーを投げます。

### 2. キーがあれば、組を集める

```erlang:line-numbers=1170
with_1([K|Ks], Map) ->
    case Map of
        #{K := V} -> [{K,V}|with_1(Ks, Map)];
```

先頭のキー `K` が、マップに `#{K := V}` として存在すれば、組 `{K, V}` を結果に加えます。残りのキーについて、同じ関数を続けます。

### 3. キーが無ければ、飛ばす

```erlang:line-numbers=1173
        #{} -> with_1(Ks, Map)
    end;
```

キーが無ければ、何も加えずに、残りのキーについて続けます。

### 4. キーが尽きたら、空の一覧

```erlang:line-numbers=1175
with_1([], _Map) -> [].
```

キーのリストが空になったら、空の一覧を返します。

## ここがすごい

### 無いキーを、失敗ではなく無視する

キーを一つずつマップで確かめ、無いものは飛ばします。
「指定されたキーのうち、あるものだけ欲しい」という場面で、わざわざ存在を事前に調べなくて済みます。

### 組を集めてから、マップを作る

結果は、組のリストとして一度集め、最後に `maps:from_list/1` でマップにします。
途中のマップを何度も作り直さず、一度に組み立てるので、無駄が少ない形です。

### `without` と並べて読む

`maps:without/2` は、キーを取り除くことで絞り込みます。`maps:with/2` は、キーを残すことで絞り込みます。
二つを並べると、マップから指定の部分を選ぶ、二つの方向が対になっていることがよく分かります。

## まとめ

`maps:with([a, c], #{a => 1, b => 2, c => 3})` は、`#{a => 1, c => 3}` を返します。
マップに無い `d` は、何も起きず、結果に入りません。
