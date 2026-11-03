---
title: "マップの値を、キーが存在するときだけ関数で書き換える"
description: "maps:update_with/3 は、キーが存在すれば、その値に関数を適用して置き換える。キーが無ければ badkey のエラーを投げる。新しいマップを返し、元は変えない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [633, 639]
function: "maps:update_with/3"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "エラー処理"]
---
## ひとことで

`maps:update_with/3` は、マップの中の既にあるキーの値に、関数 `Fun` を適用して、結果を同じキーに入れ直します。
キーが無いときは、勝手に追加せず、`badkey` のエラーを投げます。値の追加ではなく、既存の値の更新だけを行う関数です。

## コード

```erlang:line-numbers=633
update_with(Key, Fun, Map) when is_function(Fun, 1), is_map(Map) ->
    case Map of
        #{Key := Value} -> Map#{Key := Fun(Value)};
        #{} -> error({badkey,Key}, [Key,Fun,Map])
    end;
update_with(Key, Fun, Map) ->
    error_with_info(error_type(Map), [Key,Fun,Map]).
```

## 前提知識

- **マップ**: `#{キー => 値}` の形で、キーと値を持つデータ構造です。Erlang のマップは、値を変えずに、変えた新しいマップを作ります。
- **`#{Key := Value}` パターン**: キーがマップに存在するときだけ、マッチします。値を `Value` に受けます。
- **`Map#{Key := New}`**: 既にあるキーの値を `New` に替えた、新しいマップを作る式です。キーが無ければ、この式は使えません。
- **`error/2`**: エラーを投げる関数です。第二引数に、呼び出しの引数を入れます。

## 何をしているか

### 1. 入口で、関数とマップの形を確かめる

```erlang:line-numbers=633
update_with(Key, Fun, Map) when is_function(Fun, 1), is_map(Map) ->
    case Map of
```

`update_with/3` は、`Fun` が引数を一つ取る関数であることと、`Map` がマップであることを確かめます。
その後、`case` で、キーが存在するかを調べます。

### 2. キーがあれば、値に関数を適用して替える

```erlang:line-numbers=635
        #{Key := Value} -> Map#{Key := Fun(Value)};
```

キーが存在すれば、その値 `Value` に `Fun` を当てはめ、結果で同じキーの値を替えます。
替えた結果は、新しいマップです。

### 3. キーが無ければ、badkey のエラー

```erlang:line-numbers=636
        #{} -> error({badkey,Key}, [Key,Fun,Map])
    end;
```

キーが存在しなければ、`{badkey, Key}` のエラーを投げます。マップに、勝手に新しいキーを追加しません。

### 4. マップでない場合は、型のエラー

```erlang:line-numbers=638
update_with(Key, Fun, Map) ->
    error_with_info(error_type(Map), [Key,Fun,Map]).
```

`Map` がマップでなければ、型のエラーを投げる補助関数を呼びます。

## ここがすごい

### 存在しないキーを、勝手に作らない

「あれば替える、無ければエラー」という決まりを、`case` の二つの節で書いています。
もし無ければ作る、という動きにすると、キーの書き間違いが静かに増えてしまいます。この関数は、そうした誤りを、エラーとして表に出します。

### 新しいマップを返す

Erlang のマップは、変更できません。
`Map#{Key := ...}` は、元のマップを残したまま、替えた新しいマップを作ります。呼び出し側は、元の値を使い続けても安全です。

### 失敗の理由を引数に残す

`error({badkey, Key}, [Key, Fun, Map])` の第二引数には、呼び出しの引数を入れています。
どのキーが無かったのか、どのマップだったのかが、エラーの情報に残ります。デバッグのときに、呼び出しの状況を追いやすくなります。

## まとめ

`maps:update_with(a, fun(V) -> V + 1 end, #{a => 1})` は、`#{a => 2}` を返します。
キーが無い `maps:update_with(b, fun(V) -> V end, #{a => 1})` は、`badkey` のエラーになります。
