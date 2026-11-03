---
title: "順序付き辞書の同じキーに、値のリストへ要素を末尾から足す"
description: "orddict:append/3 は、キーの値をリストとみなし、新しい要素をその末尾に足す。キーが無ければ、一要素のリストを新しく作る。昇順の並びを保つ。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [358, 364]
function: "orddict:append/3"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`orddict:append/3` は、順序付き辞書で、キーに対応する値のリストへ、新しい要素を末尾から足します。
キーが無ければ、新しい値として一要素のリストを作って、昇順の並びの正しい位置に入れます。

## コード

::: code-group

```erlang:line-numbers=358 [日本語訳]
append(Key, New, [{K,_}|_]=Dict) when Key < K ->
    [{Key,[New]}|Dict];
append(Key, New, [{K,_}=E|Dict]) when Key > K ->
    [E|append(Key, New, Dict)];
append(Key, New, [{_K,Old}|Dict]) ->		%キーが一致したとき、値のリストの末尾に新しい要素を足す
    [{Key,Old ++ [New]}|Dict];
append(Key, New, []) -> [{Key,[New]}].
```

```erlang:line-numbers=358 [原文]
append(Key, New, [{K,_}|_]=Dict) when Key < K ->
    [{Key,[New]}|Dict];
append(Key, New, [{K,_}=E|Dict]) when Key > K ->
    [E|append(Key, New, Dict)];
append(Key, New, [{_K,Old}|Dict]) ->		%Key == K
    [{Key,Old ++ [New]}|Dict];
append(Key, New, []) -> [{Key,[New]}].
```

:::

## 前提知識

- **順序付き辞書（orddict）**: `{Key, Value}` の組を、キーの昇順に並べたリストです。
- **値のリスト**: この関数では、値をリストとして扱います。`[New]` は、要素が一つだけのリストです。
- **`Old ++ [New]`**: 古いリストの末尾に、新しい要素を足します。`++` は、左側のリストを全部コピーします。
- **比較 `<`、`>`、`==`**: 探すキーと、先頭の組のキーの大小で、どこまで進むかを決めます。

## 何をしているか

### 1. キーが先頭より小さければ、ここに新しい組を入れる

```erlang:line-numbers=358
append(Key, New, [{K,_}|_]=Dict) when Key < K ->
    [{Key,[New]}|Dict];
```

探すキー `Key` が先頭のキー `K` より小さければ、キーは無いと分かります。昇順を保つために、この位置に `{Key, [New]}` を入れます。

### 2. キーが先頭より大きければ、先頭を残して進む

```erlang:line-numbers=360
append(Key, New, [{K,_}=E|Dict]) when Key > K ->
    [E|append(Key, New, Dict)];
```

`Key` が `K` より大きければ、先頭の組はそのまま残し、残りの辞書で続けます。

### 3. キーが一致すれば、値の末尾に足す

```erlang:line-numbers=362
append(Key, New, [{_K,Old}|Dict]) ->		%Key == K
    [{Key,Old ++ [New]}|Dict];
```

キーが一致したら、古い値 `Old` の末尾に `New` を足して、組を作り直します。

### 4. 空の辞書なら、一要素の組を作る

```erlang:line-numbers=364
append(Key, New, []) -> [{Key,[New]}].
```

辞書が空なら、`{Key, [New]}` だけを持つ辞書を返します。

## ここがすごい

### 同じキーに、次々と足していける

同じキーを何度 `append` しても、値のリストは、足した順に伸びていきます。
値を集めるための、よく使われる形です。キーごとにまとめて、要素を溜めていけます。

### 昇順を保ちながら、新しいキーを入れる

キーが無いときは、正しい位置に組を挿入します。
「先頭より小さい」か「途中で飛んでいる」かで、挿入する場所が決まります。並びが崩れないことを、比較の節が保っています。

### 足すための、コピーのコスト

`Old ++ [New]` は、古いリストを全部コピーします。
値のリストが長くなるほど、一回の追加が重くなります。たくさん足すときは、逆順に積んでおき、最後に反転する、という工夫もあります。

## まとめ

`orddict:append(b, 2, [{a, [1]}, {b, [1]}])` は、`[{a, [1]}, {b, [1, 2]}]` を返します。
キー `b` の値のリストの末尾に、`2` が足されました。
